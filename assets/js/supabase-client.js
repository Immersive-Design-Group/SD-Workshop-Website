// Supabase Client Configuration
// Replace these with your actual Supabase credentials

const SUPABASE_URL = 'https://ovuiailpucqhfqhxbvtk.supabase.co'; // Get from Supabase dashboard
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92dWlhaWxwdWNxaGZxaHhidnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTI3ODgsImV4cCI6MjA3MDY2ODc4OH0.6nzETZ-yXtprmIP85Uur5CoZldgpW3vsP0aKeP2t7uk'; // Get from Supabase dashboard

// Initialize Supabase client (with error handling)
let supabase = null;

try {
  if (typeof window !== 'undefined' && window.supabase && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized successfully');
  } else {
    console.warn('Supabase not configured or not available. Running in demo mode.');
  }
} catch (error) {
  console.warn('Error initializing Supabase:', error);
}

// Database helper functions
const SupabaseClient = {
  // Check if Supabase is available
  isAvailable() {
    return supabase !== null;
  },

  // Get all equipment
  async getEquipment() {
    if (!this.isAvailable()) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching equipment:', error);
      return { success: false, error: error.message };
    }
  },

  // Get bookings for a specific date
  async getBookings(date) {
    if (!this.isAvailable()) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', date)
        .eq('status', 'active');
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return { success: false, error: error.message };
    }
  },

  // Create a new booking
  async createBooking(bookingData) {
    if (!this.isAvailable()) {
      // Demo mode - show success message but don't actually save
      console.log('Demo booking (would be saved to database):', bookingData);
      alert('Demo Mode: Booking would be saved to database. Please configure Supabase to enable real bookings.');
      return { success: true, data: { id: 'demo-' + Date.now(), ...bookingData } };
    }
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select();
      
      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error creating booking:', error);
      return { success: false, error: error.message };
    }
  },

  // Cancel a booking
  async cancelBooking(bookingId) {
    if (!this.isAvailable()) {
      console.log('Demo mode - would cancel booking:', bookingId);
      alert('Demo Mode: Booking would be cancelled. Please configure Supabase to enable real cancellations.');
      return { success: true, data: { id: bookingId, status: 'cancelled' } };
    }
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select();
      
      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return { success: false, error: error.message };
    }
  },

  // Generate and store OTP
  async generateOTP(bookingId, email) {
    if (!this.isAvailable()) {
      const otpCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      console.log('Demo OTP generated:', otpCode);
      return { success: true, data: { id: 'demo-otp', booking_id: bookingId, email: email }, otpCode };
    }
    
    try {
      // Generate 6-digit OTP
      const otpCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      const { data, error } = await supabase
        .from('otp_codes')
        .insert([{
          booking_id: bookingId,
          email: email,
          otp_code: otpCode,
          expires_at: expiresAt.toISOString()
        }])
        .select();
      
      if (error) throw error;
      return { success: true, data: data[0], otpCode };
    } catch (error) {
      console.error('Error generating OTP:', error);
      return { success: false, error: error.message };
    }
  },

  // Verify OTP
  async verifyOTP(bookingId, otpCode) {
    if (!this.isAvailable()) {
      // Demo mode - accept any 6-character code
      if (otpCode && otpCode.length === 6) {
        return { success: true, data: { id: 'demo-verify', booking_id: bookingId } };
      } else {
        return { success: false, error: 'Demo mode: Please enter any 6-character code' };
      }
    }
    
    try {
      const { data, error } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('otp_code', otpCode)
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return { success: false, error: 'Invalid or expired OTP' };
      }

      // Mark OTP as used
      await supabase
        .from('otp_codes')
        .update({ used: true })
        .eq('id', data.id);

      return { success: true, data };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to real-time changes
  subscribeToBookings(callback) {
    if (!this.isAvailable()) {
      console.log('Real-time subscriptions not available in demo mode');
      return null;
    }
    
    const subscription = supabase
      .channel('bookings')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings' 
      }, callback)
      .subscribe();

    return subscription;
  },

  // Unsubscribe from real-time changes
  unsubscribe(subscription) {
    if (subscription && supabase) {
      supabase.removeChannel(subscription);
    }
  }
};

// Email service configuration
const EmailService = {
  // Initialize EmailJS (you need to set this up)
  init() {
    // Replace with your EmailJS configuration
    // Get these from emailjs.com after creating an account
    this.serviceId = 'YOUR_EMAILJS_SERVICE_ID';
    this.templateId = 'YOUR_EMAILJS_TEMPLATE_ID';
    this.userId = 'YOUR_EMAILJS_USER_ID';
  },

  // Send confirmation email
  async sendConfirmationEmail(bookingData) {
    try {
      // In demo mode, just log the email data
      if (!SupabaseClient.isAvailable()) {
        console.log('Demo mode - would send confirmation email:', bookingData);
        return { success: true, message: 'Demo mode: Email would be sent' };
      }

      // You'll need to set up EmailJS and create an email template
      const templateParams = {
        to_email: bookingData.user_email,
        user_name: bookingData.user_name,
        equipment_name: bookingData.equipment_name,
        booking_date: bookingData.booking_date,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        purpose: bookingData.purpose
      };

      // Uncomment when EmailJS is configured
      // const result = await emailjs.send(this.serviceId, this.templateId, templateParams, this.userId);
      // return { success: true, result };

      // For now, just log the email data
      console.log('Would send confirmation email:', templateParams);
      return { success: true, message: 'Email would be sent (EmailJS not configured)' };
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return { success: false, error: error.message };
    }
  },

  // Send OTP email
  async sendOTPEmail(email, otpCode, userName) {
    try {
      // In demo mode, show the OTP in an alert
      if (!SupabaseClient.isAvailable()) {
        alert(`Demo Mode - Your OTP is: ${otpCode}\n(In production, this would be sent to your email)`);
        return { success: true, message: 'Demo OTP shown' };
      }

      const templateParams = {
        to_email: email,
        user_name: userName,
        otp_code: otpCode
      };

      // Uncomment when EmailJS is configured
      // const result = await emailjs.send(this.serviceId, 'otp_template', templateParams, this.userId);
      // return { success: true, result };

      // For now, just show an alert with the OTP (for testing)
      alert(`OTP for testing: ${otpCode}\n(Check console for details)`);
      console.log('Would send OTP email:', templateParams);
      return { success: true, message: 'OTP email would be sent (EmailJS not configured)' };
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return { success: false, error: error.message };
    }
  }
};

// Initialize email service
EmailService.init();
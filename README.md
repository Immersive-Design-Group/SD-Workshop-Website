# SD Workshop Website

A comprehensive website for the SD (School of Design) Workshop at SUSTech, featuring equipment reservation system, equipment catalog, and workshop information.

## 🌟 Overview

The SD Workshop Website is a responsive web application designed to manage and showcase the workshop's equipment and facilities. It provides students and staff with an intuitive interface to:

- **Browse Equipment Catalog**: View detailed information about available 3D printers, laser cutters, soldering stations, and other workshop tools
- **Reserve Equipment**: Book time slots for equipment usage with a sophisticated reservation system
- **Manage Bookings**: View, modify, and cancel existing reservations
- **Access Workshop Information**: Learn about workshop rules, TA schedules, and safety guidelines

## 🚀 Features

### Equipment Management
- **Equipment Catalog**: Comprehensive listing with images, specifications, and status
- **Status Tracking**: Real-time equipment status (working, broken, maintenance, out of service)
- **Visual Indicators**: Clear status badges and visual cues for equipment availability

### Reservation System
- **Smart Time Slots**: 30-minute time slots from 9:00 AM to 10:00 PM
- **Multi-Slot Selection**: Select multiple consecutive time slots (up to 5 hours)
- **Real-time Availability**: Live updates showing booked and available slots
- **Date Navigation**: Easy date selection with weekend/holiday restrictions
- **Email Validation**: SUSTech email domain verification

### User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Interactive Interface**: Drag-and-drop slot selection, keyboard shortcuts
- **Real-time Updates**: Current time indicator and live booking status

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with CSS Grid and Flexbox
- **Backend Integration**: Google Apps Script for data management
- **Hosting**: GitHub Pages (Jekyll-based)
- **Responsive Design**: Mobile-first approach with breakpoint optimization

## 📁 Project Structure

```
SD-Workshop-Website/
├── _data/                    # Jekyll data files
│   ├── equip-categories.yml  # Equipment categories
│   ├── navigation.yml        # Site navigation
│   ├── reservation.yml       # Equipment and reservation data
│   └── ta-schedule.yml       # Teaching assistant schedules
├── _equipment/               # Individual equipment pages
├── _includes/                # Reusable HTML components
├── _layouts/                 # Page layout templates
├── assets/                   # Static assets
│   ├── css/                  # Stylesheets
│   ├── js/                   # JavaScript files
│   └── images/               # Images and icons
├── CNAME                     # Custom domain configuration
└── index.md                  # Homepage
```

## 🚀 Getting Started

### Prerequisites
- **Git**: For version control
- **Web Browser**: Modern browser with JavaScript enabled
- **Text Editor**: VS Code, Sublime Text, or any code editor

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/SD-Workshop-Website.git
   cd SD-Workshop-Website
   ```

2. **Local Development**
   - The website is built with Jekyll and can be run locally
   - Install Jekyll: `gem install jekyll bundler`
   - Install dependencies: `bundle install`
   - Run locally: `bundle exec jekyll serve`
   - Access at: `http://localhost:4000`

3. **Production Deployment**
   - Push to GitHub repository
   - Enable GitHub Pages in repository settings
   - Website is available at: `sustechsdworkshop.com`

### Configuration

1. **Equipment Data**: Edit `_data/reservation.yml` to:
   - Add/remove equipment
   - Update equipment status
   - Modify equipment details

2. **Workshop Rules**: Update `_data/reservation.yml` rules section for:
   - Chinese and English rule text
   - Workshop policies
   - Safety guidelines

3. **Custom Domain**: Update `CNAME` file with your domain name

## 📋 Equipment Status Management

The system supports four equipment statuses:

- **`working`** ✅ - Equipment is fully functional and available
- **`broken`** 🚫 - Equipment is broken and cannot be used
- **`maintenance`** 🔧 - Equipment is under maintenance/repair
- **`out_of_service`** ⛔ - Equipment is temporarily out of service

### Adding Equipment Status
```yaml
equipment:
  - id: "eq1"
    name: "3D PRINTER 1"
    model: "P1E"
    image: "/assets/images/Equipments/bambulabP1E.png"
    status: "working"  # Set status here
```

## 🔧 Customization

### Styling
- **Colors**: Modify CSS custom properties in `assets/css/style.css`
- **Layout**: Adjust grid and flexbox properties in CSS files
- **Responsive**: Update breakpoints in CSS media queries

### Functionality
- **Reservation Rules**: Modify time slots, booking limits in `assets/js/reservation.js`
- **Equipment Display**: Update equipment rendering logic
- **Form Validation**: Customize email domains and validation rules

### Content
- **Equipment Pages**: Add new equipment in `_equipment/` directory
- **Navigation**: Update site structure in `_data/navigation.yml`
- **Rules**: Modify workshop policies and guidelines

## 🌐 Browser Support

- **Chrome**: 90+ ✅
- **Firefox**: 88+ ✅
- **Safari**: 14+ ✅
- **Edge**: 90+ ✅
- **Mobile Browsers**: iOS Safari, Chrome Mobile ✅

## 📱 Responsive Design

The website is optimized for all device sizes:

- **Desktop**: Full-featured interface with advanced interactions
- **Tablet**: Touch-optimized with simplified navigation
- **Mobile**: Streamlined interface with essential features

## 🔒 Security Features

- **Email Validation**: SUSTech domain verification
- **Input Sanitization**: XSS protection and data validation
- **Secure Booking**: OTP-based booking management
- **Access Control**: Equipment status-based booking restrictions

## 📊 Performance

- **Optimized Images**: Compressed and responsive images
- **Minified CSS/JS**: Production-ready asset optimization
- **Lazy Loading**: Efficient resource loading
- **Caching**: Browser and CDN caching strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit changes: `git commit -am 'Add feature'`
6. Push to branch: `git push origin feature-name`
7. Submit a Pull Request


## 📞 Support

For technical support or questions:
- **Email**: designworkshop@sustech.edu.cn
- **Issues**: Create an issue on GitHub
- **Documentation**: Check the [EQUIPMENT_STATUS_GUIDE.md](EQUIPMENT_STATUS_GUIDE.md)

## 🔄 Updates and Maintenance

### Regular Tasks
- **Equipment Status**: Update equipment status in YAML files
- **Booking Data**: Monitor and clean up old booking data
- **Content Updates**: Keep workshop rules and information current
- **Performance**: Monitor and optimize loading times

### Version Control
- **Backup**: Regular backups of configuration and data files
- **Testing**: Test changes on staging before production
- **Rollback**: Maintain ability to revert to previous versions

---

**Built with ❤️ for the SUSTech SD Community**

*Last updated: October 27th, 2025*



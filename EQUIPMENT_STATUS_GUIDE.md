# Equipment Status Management Guide

This guide explains how to manage equipment status in the SD Workshop reservation system.

## Overview

The system now supports tracking equipment status to prevent users from booking broken or out-of-service equipment. When equipment is marked as unavailable, users cannot select time slots and will see clear visual indicators.

## Equipment Status Options

### Available Statuses

1. **`working`** - Equipment is fully functional and available for booking
2. **`broken`** - Equipment is broken and cannot be used
3. **`maintenance`** - Equipment is under maintenance/repair
4. **`out_of_service`** - Equipment is temporarily out of service

### Status Values in YAML

Edit `_data/reservation.yml` to set equipment status:

```yaml
equipment:
  - id: "eq1"
    name: "3D PRINTER 1"
    model: "X1E"
    image: "/assets/images/Equipments/bambulab X1E.png"
    status: "working"  # working, broken, maintenance, out_of_service
```

## Visual Indicators

### Status Badges
- **Broken**: 🚫 BROKEN (red badge)
- **Maintenance**: 🔧 MAINTENANCE (orange badge)  
- **Out of Service**: ⛔ OUT OF SERVICE (dark red badge)

### Equipment Appearance
- Broken equipment shows grayscale images with reduced opacity
- All time slots display "Equipment Unavailable" message
- Slots have diagonal striped pattern to indicate unavailability

### User Experience
- Users cannot select time slots for broken equipment
- Error messages appear when attempting to interact with broken equipment
- Booking modal cannot be opened for unavailable equipment

## How to Update Equipment Status

### 1. Edit YAML File
Open `_data/reservation.yml` and change the `status` field for the equipment:

```yaml
# Change from working to broken
- id: "eq3"
  name: "3D PRINTER 3"
  model: "X1E"
  image: "/assets/images/Equipments/bambulab X1E.png"
  status: "broken"  # Change this value
```

### 2. Save and Deploy
- Save the YAML file
- Deploy the website changes
- The system will automatically detect the status change

### 3. Verify Changes
- Check the reservation page
- Equipment should show status badge
- All time slots should be marked as unavailable
- Users should not be able to book the equipment

## Status Change Examples

### Mark Equipment as Broken
```yaml
status: "broken"
```

### Mark Equipment as Under Maintenance
```yaml
status: "maintenance"
```

### Mark Equipment as Out of Service
```yaml
status: "out_of_service"
```

### Restore Equipment to Working
```yaml
status: "working"
```

## Best Practices

1. **Use Descriptive Status**: Choose the most appropriate status for the situation
2. **Update Promptly**: Change status as soon as equipment issues are discovered
3. **Communicate with Users**: Consider adding notes about expected repair time
4. **Regular Monitoring**: Check equipment status regularly and update as needed

## Technical Details

- Status changes take effect immediately after deployment
- No database changes required - all status is stored in YAML
- System automatically prevents all interactions with broken equipment
- Status is checked at multiple levels (UI, selection, booking)

## Troubleshooting

### Equipment Still Shows as Available
- Check YAML syntax for typos
- Ensure status value matches exactly: `"broken"`, `"maintenance"`, `"out_of_service"`
- Verify file is saved and deployed

### Status Badge Not Displaying
- Check browser console for JavaScript errors
- Verify CSS is properly loaded
- Ensure equipment has valid status value

### Users Can Still Book Broken Equipment
- Clear browser cache
- Verify JavaScript changes are deployed
- Check that status check is working in console logs

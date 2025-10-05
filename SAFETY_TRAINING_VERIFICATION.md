# Safety Training Verification System

## Overview

The safety training verification system ensures that only students who have completed the required safety training can book equipment. The system verifies training status by checking student information against a training database before allowing bookings.

## How It Works

### 1. Student Information Collection
- **SID**: Required field for identification
- **Name**: Must match the name in training records
- **Email**: University email for communication
- **Equipment Type**: The specific equipment being booked

### 2. Training Verification Process
When a student clicks the "I have completed the safety training" checkbox:

1. **System Validation**: The system automatically verifies the training status by:
   - Checking if the SID exists in the training database
   - Verifying that the name matches the training record
   - Confirming the training status is "Completed"
   - Ensuring the training covers the requested equipment type

2. **Verification Results**:
   - ✅ **Verified**: Student has completed training for the equipment
   - ❌ **Not Found**: Student not in training database
   - ❌ **Incomplete**: Training not completed
   - ❌ **Equipment Not Covered**: Training doesn't cover requested equipment

### 3. Booking Process
- If verification fails, the booking is blocked with a clear error message
- If verification succeeds, the booking proceeds normally
- All booking data (including student number) is stored in the system

## Database Structure

### Training Database (CSV Format)
```csv
SID,Name,Email,Training Status,Training Date,Equipment Type
12345678,John Doe,john.doe@mail.sustech.edu.cn,Completed,15/01/2024,3D Printer
87654321,Jane Smith,jane.smith@mail.sustech.edu.cn,Completed,20/02/2024,Laser Cutter
99887766,Charlie Wilson,charlie.wilson@mail.sustech.edu.cn,Completed,05/02/2024,All Equipment
```

### Fields Explained
- **SID**: Unique identifier for the student
- **Name**: Full name as it appears in university records
- **Email**: University email address
- **Training Status**: "Completed" or "Incomplete"
- **Training Date**: Date when training was completed
- **Equipment Type**: Specific equipment or "All Equipment" for general training

## API Endpoints

### Training Verification
```
GET /api/verify-training?sid=12345678&name=John%20Doe&equipment=3D%20Printer
```

**Response Examples:**

Success:
```json
{
  "ok": true,
  "message": "Training verification successful",
  "trainingStatus": "verified",
  "trainingDate": "2024-01-15"
}
```

Failure:
```json
{
  "ok": false,
  "error": "Student not found in training records. Please ensure you have completed safety training.",
  "trainingStatus": "not_found"
}
```

## User Experience

### 1. Form Filling
- Student enters their information including SID
- System validates all required fields

### 2. Training Checkbox
- Student must check "I have completed the safety training and accept the training instructions"
- When checked, system automatically verifies training status

### 3. Verification Feedback
- **Success**: Booking proceeds normally
- **Failure**: Clear error message explaining why verification failed
- **Error Types**:
  - "Student not found in training records"
  - "Safety training not completed"
  - "Training not completed for [equipment type]"

### 4. Booking Completion
- If verification passes, booking is created
- Student receives confirmation email
- Booking data includes SID for tracking

## Error Handling

### Common Error Messages
1. **"Student not found in training records"**
   - Solution: Ensure student has completed training and is in the database

2. **"Safety training not completed"**
   - Solution: Student must complete training before booking

3. **"Training not completed for [equipment]"**
   - Solution: Student needs specific training for that equipment type

4. **"Training verification failed"**
   - Solution: Technical issue, student should try again

## Maintenance

### Adding New Students
1. Update the training database CSV file
2. Ensure all required fields are populated
3. Set training status to "Completed"
4. Specify appropriate equipment type

### Updating Training Records
1. Modify the CSV file with new information
2. Ensure data consistency
3. Test verification with sample data

### Equipment-Specific Training
- Students can have training for specific equipment types
- "All Equipment" training covers all equipment
- System checks if training covers the requested equipment

## Security Considerations

1. **Data Validation**: All inputs are validated and sanitized
2. **Error Messages**: Generic error messages prevent information leakage
3. **Rate Limiting**: API calls are limited to prevent abuse
4. **Data Privacy**: Student information is handled securely

## Testing

### Test Cases
1. **Valid Student**: Should allow booking
2. **Invalid Student Number**: Should block booking
3. **Name Mismatch**: Should block booking
4. **Incomplete Training**: Should block booking
5. **Equipment Not Covered**: Should block booking
6. **Network Error**: Should show retry message

### Sample Test Data
```
SID: 12345678
Name: John Doe
Equipment: 3D Printer
Expected: ✅ Verified

SID: 99999999
Name: Test Student
Equipment: Laser Cutter
Expected: ❌ Not Found
```

## Troubleshooting

### Common Issues
1. **Verification Always Fails**
   - Check if student data is in the database
   - Verify name spelling matches exactly
   - Ensure training status is "Completed"

2. **API Errors**
   - Check network connectivity
   - Verify API endpoint is accessible
   - Check server logs for errors

3. **Form Validation Issues**
   - Ensure all required fields are filled
   - Check SID format
   - Verify email domain is correct

## Future Enhancements

1. **Real-time Database**: Replace CSV with live database
2. **Training Expiry**: Add training expiration dates
3. **Equipment-Specific Training**: More granular training requirements
4. **Admin Interface**: Web interface for managing training records
5. **Training Certificates**: Integration with certificate system
6. **Audit Trail**: Track all verification attempts

## Support

For technical issues or questions about the training verification system, contact the SD-Workshop team.

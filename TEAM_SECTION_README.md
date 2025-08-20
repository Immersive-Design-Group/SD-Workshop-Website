# Team Section Management Guide

## Overview
The team section displays team members who contributed to designing and developing the website. It's located below the TA Schedule on the index page.

## Files to Modify

### 1. Team Data (`_data/team.yml`)
This file contains all the team member information. To add, remove, or modify team members:

```yaml
title: "Team Members"

organizers:
  group_name: "Immersive Design Group"  # Optional: can be removed to hide group name
  members:
    - name: "Organizer Name"
      degree: "PhD/Masters/Bachelor"    # Optional: can be removed to hide degree
      image: "/assets/images/team/organizer-photo.jpg"
      link: "https://example.com/organizer-profile"  # Optional: makes image clickable

designers:
  group_name: "Immersive Design Group"  # Optional: can be removed to hide group name
  members:
    - name: "Member Name"
      degree: "PhD/Masters/Bachelor"
      image: "/assets/images/team/member-photo.jpg"
      link: "https://example.com/member-profile"    # Optional: makes image clickable

developers:
  group_name: "Immersive Design Group"  # Optional: can be removed to hide group name
  members:
    - name: "Developer Name"
      degree: "PhD/Masters/Bachelor"
      image: "/assets/images/team/developer-photo.jpg"
      link: "https://github.com/developer-username"  # Optional: makes image clickable
```

**Note:** Each section (organizers/designers/developers) can have its own `group_name` field. If you remove it or set it to an empty string, the group name will not be displayed for that section.

**Degree Field:** The `degree` field is optional for organizers. If you remove it or set it to an empty string, the degree will not be displayed.

**Link Field:** The `link` field is optional for all members. If you include it, the member's image becomes clickable and will open the link in a new tab. If you remove it or set it to an empty string, the image will not be clickable.

### 2. Team Images (`assets/images/team/`)
- Place team member photos in this directory
- Recommended size: 80x80 pixels (minimum)
- Format: JPG, PNG, or WebP
- Naming convention: `firstname-lastname.jpg`

### 3. Styling (`assets/css/style.css`)
The team section styles are located in the CSS file under the "Team Members Section" comment block.

## How It Works

1. **Jekyll Data**: The system reads team information from `_data/team.yml`
2. **Template**: The `index.md` file uses Liquid templating to display team members
3. **Group Name Display**: Each section can have its own group name that appears on the right side of the section title
4. **Text Style**: Group names use the same font style as section titles (same size, weight, and color)
5. **Clickable Images**: Member images with links become clickable and open in new tabs
6. **Responsive**: The layout automatically adjusts for different screen sizes
7. **Avatar Sizing**: Images are automatically sized larger on bigger screens (90px on 1200px+, 110px on 1600px+, 120px on 1920px+)

## Adding a New Team Member

1. **Add to data file**: Update `_data/team.yml` with the new member's information under the appropriate section
2. **Add photo**: Place the member's photo in `assets/images/team/`
3. **Update image path**: Ensure the image path in the data file matches the actual file location
4. **Add link (optional)**: Include a `link` field to make the image clickable

## Managing Group Names

- **To show group name**: Add or keep the `group_name` field in the respective section
- **To hide group name**: Remove the `group_name` field or set it to an empty string
- **To change group name**: Simply update the value in the YAML file
- **Different group names**: Each section can have a different group name if needed

## Managing Degrees

- **For Organizers**: The `degree` field is optional. Remove it or set to empty string to hide
- **For Designers/Developers**: The `degree` field is required and will always display

## Managing Links

- **To make image clickable**: Add a `link` field with the URL (e.g., personal website, GitHub, LinkedIn)
- **To remove clickability**: Remove the `link` field or set it to an empty string
- **Link behavior**: All links open in new tabs for better user experience
- **Link examples**:
  - Personal website: `https://example.com/username`
  - GitHub: `https://github.com/username`
  - LinkedIn: `https://linkedin.com/in/username`
  - Research profile: `https://research.example.edu/username`

## Responsive Breakpoints

- **Desktop (1200px+)**: Larger avatars (90px)
- **Large Desktop (1400px+)**: Even larger avatars (100px)
- **Large Desktop (1600px+)**: Even larger avatars (110px)
- **Ultra-wide (1920px+)**: Largest avatars (120px)
- **Tablet (≤768px)**: Adjusted spacing and sizing
- **Mobile (≤480px)**: Compact layout optimized for small screens

## Customization

### Colors
- Primary text: `#000`
- Secondary text: `#374151`
- Group name: `#000` (same as section titles)
- Background: `#fff`
- Avatar borders: `#e5e7eb`
- Hover borders: `#3b82f6`
- Link hover shadow: `rgba(59, 130, 246, 0.3)`

### Typography
- Uses Inter and Noto Sans SC fonts
- Group names use the same font size and weight as section titles
- Responsive font sizing
- Consistent with other sections

### Layout
- Clean, aligned design matching the TA Schedule table
- Hover effects for interactivity (scale + shadow for clickable images)
- Flexible grid system for different member counts

## Troubleshooting

### Images Not Loading
- Check file paths in `_data/team.yml`
- Ensure images exist in `assets/images/team/`
- Verify file permissions
- Check browser console for errors

### Layout Issues
- Verify CSS is properly loaded
- Check for conflicting styles
- Test on different screen sizes

### Data Not Displaying
- Ensure Jekyll is rebuilding the site
- Check YAML syntax in `_data/team.yml`
- Verify template syntax in `index.md`

### Group Name Not Showing
- Check that `group_name` field exists in the respective section
- Ensure the field has a value (not empty string)
- Verify the template is using the correct field path

### Degree Not Showing for Organizers
- Check that the `degree` field exists in the organizer's data
- Ensure the field has a value (not empty string)
- The degree field is optional for organizers

### Links Not Working
- Check that the `link` field exists and has a valid URL
- Ensure the URL is properly formatted (includes `http://` or `https://`)
- Verify the link opens in a new tab as expected
- Test the URL directly in your browser


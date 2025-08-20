# Team Section Management Guide

## Overview
The team section displays team members who contributed to designing and developing the website. It's located below the TA Schedule on the index page.

## Files to Modify

### 1. Team Data (`_data/team.yml`)
This file contains all the team member information. To add, remove, or modify team members:

```yaml
title: "Team Members"

designers:
  group_name: "Immersive Design Group"  # Optional: can be removed to hide group name
  members:
    - name: "Member Name"
      degree: "PhD/Masters/Bachelor"
      image: "/assets/images/team/member-photo.jpg"

developers:
  group_name: "Immersive Design Group"  # Optional: can be removed to hide group name
  members:
    - name: "Developer Name"
      degree: "PhD/Masters/Bachelor"
      image: "/assets/images/team/developer-photo.jpg"
```

**Note:** Each section (designers/developers) can have its own `group_name` field. If you remove it or set it to an empty string, the group name will not be displayed for that section.

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
5. **Responsive**: The layout automatically adjusts for different screen sizes
6. **Avatar Sizing**: Images are automatically sized larger on bigger screens (90px on 1200px+, 110px on 1600px+, 120px on 1920px+)

## Adding a New Team Member

1. **Add to data file**: Update `_data/team.yml` with the new member's information under the appropriate section
2. **Add photo**: Place the member's photo in `assets/images/team/`
3. **Update image path**: Ensure the image path in the data file matches the actual file location

## Managing Group Names

- **To show group name**: Add or keep the `group_name` field in the respective section
- **To hide group name**: Remove the `group_name` field or set it to an empty string
- **To change group name**: Simply update the value in the YAML file
- **Different group names**: Each section can have a different group name if needed

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

### Typography
- Uses Inter and Noto Sans SC fonts
- Group names use the same font size and weight as section titles
- Responsive font sizing
- Consistent with other sections

### Layout
- Clean, aligned design matching the TA Schedule table
- Hover effects for interactivity
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


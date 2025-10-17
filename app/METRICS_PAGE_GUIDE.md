# Metrics Page Guide

The Projects page has been transformed into a comprehensive Metrics page with detailed analytics and visualizations.

## What's New

### Overview
The Metrics page provides in-depth analytics for your research projects, including:
- Statistical summaries
- Interactive charts and graphs
- Species distribution analysis
- Confidence level tracking
- Timeline visualization

## Features

### 1. **Project Selection**
- Dropdown menu to switch between projects
- Automatically selects the first project on load
- Smooth loading transitions

### 2. **Key Statistics Cards**
Four main metrics displayed prominently:
- **Total Analyses**: Number of images analyzed in the project
- **Average Confidence**: Mean probability across all analyses
- **Species Found**: Number of unique species detected
- **Active Days**: Days with analysis activity

### 3. **Species Distribution (Pie Chart)**
- Visual breakdown of detected species
- Percentage labels on each slice
- Color-coded legend showing top 5 species
- Count badges for each species

### 4. **Confidence Distribution (Bar Chart)**
- Shows how analyses are distributed across confidence ranges
- Five ranges: 0-20%, 20-40%, 40-60%, 60-80%, 80-100%
- Highlights the most common confidence range

### 5. **Analysis Timeline (Line Chart)**
- Tracks the number of analyses over time
- Groups data by day
- Shows activity patterns and trends

### 6. **Top Species Details**
- Ranked list of most frequently detected species
- Shows detection count and percentage for each
- Top 5 species highlighted

## How It Works

### Data Flow
1. **Fetch Projects**: Loads all user projects from Firestore
2. **Select Project**: User picks a project from dropdown
3. **Fetch Analyses**: Retrieves all analyses for selected project
4. **Calculate Metrics**: Processes data to generate statistics
5. **Render Visualizations**: Displays charts using Recharts library

### Technical Details

**Charts Library**: Recharts
- PieChart for species distribution
- BarChart for confidence levels
- LineChart for timeline

**Data Structure**:
```typescript
interface ProjectMetrics {
  project: Project;
  totalAnalyses: number;
  avgConfidence: number;
  speciesBreakdown: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  confidenceDistribution: Array<{
    range: string;
    count: number;
  }>;
  timelineData: Array<{
    date: string;
    count: number;
  }>;
  analyses: Analysis[];
}
```

## Navigation

**Access**: Click "Metrics" in the navigation bar (replaces "Projects")

**URL**: `/metrics`

**Protected**: Requires authentication

## Empty States

The page handles three scenarios gracefully:
1. **No Projects**: Shows a message to create projects first
2. **No Analyses**: Indicates the project has no data yet
3. **Loading**: Displays a spinner while fetching data

## Benefits

### For Researchers
- Quick overview of project status
- Identify trends and patterns
- Track species diversity
- Monitor analysis quality (confidence levels)
- Understand temporal patterns

### For Data Analysis
- Export-ready statistics
- Visual representations for presentations
- Comparative metrics across projects
- Data-driven insights

## Future Enhancements (Potential)

1. **Export Functionality**: Download charts as images or PDFs
2. **Date Range Filters**: Focus on specific time periods
3. **Comparison Mode**: Compare metrics across multiple projects
4. **Advanced Analytics**: Statistical tests, correlation analysis
5. **Custom Reports**: Generate formatted reports
6. **Real-time Updates**: Live data refresh as new analyses come in

## Notes

- The old Projects.tsx file is backed up as `Projects.tsx.backup`
- All project management features (create, edit, delete) can be added to the Analysis page's project selector
- Charts are responsive and adapt to screen size
- Color scheme follows the application theme

## Related Files

- `/src/pages/Metrics.tsx` - Main metrics page component
- `/src/App.tsx` - Updated routing
- `/src/components/Navbar.tsx` - Updated navigation links
- `/src/pages/Projects.tsx.backup` - Original projects page (backup)



# 🧪 Data Alchemist: AI-Powered Resource Allocation Configurator

Data Alchemist is a sophisticated Next.js web application that transforms messy spreadsheet data into clean, validated, and AI-optimized resource allocation configurations. Built for non-technical users who need to manage complex resource allocation scenarios.

## ✨ Features

### 🚀 Core Functionality
- **AI-Powered File Parsing**: Automatically detects and maps headers from CSV/Excel files
- **Comprehensive Data Validation**: 12+ validation rules including duplicate IDs, malformed data, and cross-references
- **Interactive Data Grid**: Inline editing with real-time validation
- **Natural Language Search**: Search data using plain English queries
- **Business Rules Builder**: Create complex allocation rules with AI assistance
- **Prioritization System**: Advanced weighting and preset optimization profiles

### 🤖 AI Capabilities
- **Smart Header Mapping**: Automatically maps incorrectly named columns
- **Natural Language Rule Creation**: Convert plain English to business rules
- **Intelligent Suggestions**: AI-powered recommendations for data improvements
- **Pattern Recognition**: Automatic detection of potential business rules
- **Error Correction**: One-click fixes for common data issues

### 📊 Data Management
- **Multi-Format Support**: CSV and Excel file upload
- **Real-time Validation**: Immediate feedback on data quality
- **Cross-Reference Checking**: Ensures data consistency across entities
- **Export Capabilities**: Clean CSV files + JSON configuration

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **File Processing**: XLSX.js, react-dropzone
- **UI Components**: Lucide React icons, custom components

### Project Structure
```
src/
├── app/                 # Next.js app router
├── components/          # React components
│   ├── FileUpload.tsx   # File upload with AI parsing
│   ├── DataGrid.tsx     # Interactive data grid
│   ├── ValidationPanel.tsx # Validation results
│   ├── RulesBuilder.tsx # Business rules creation
│   └── PrioritizationPanel.tsx # Priority weights
├── lib/                 # Utility functions
│   ├── validation.ts    # Data validation logic
│   ├── excel-parser.ts  # Excel file parsing
│   └── ai-parser.ts     # AI-powered features
├── store/               # Zustand state management
├── types/               # TypeScript interfaces
└── samples/             # Sample data files
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd data-alchemist

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage
1. **Upload Data**: Use the sample CSV files or upload your own CSV/Excel files
2. **Review & Edit**: Use the interactive data grid to review and edit data
3. **Validate**: Check the validation panel for any data issues
4. **Create Rules**: Build business rules using natural language or manual input
5. **Set Priorities**: Configure allocation priorities using sliders or presets
6. **Export**: Download cleaned data and configuration files

## 📁 Sample Data

The application includes sample CSV files in the `src/samples/` directory:
- `clients.csv` - Client data with priorities and task requests
- `workers.csv` - Worker data with skills and availability
- `tasks.csv` - Task data with requirements and constraints

### Data Structure

#### Clients
- `ClientID`: Unique identifier
- `ClientName`: Client name
- `PriorityLevel`: 1-5 priority scale
- `RequestedTaskIDs`: Comma-separated task IDs
- `GroupTag`: Client grouping
- `AttributesJSON`: Additional metadata

#### Workers
- `WorkerID`: Unique identifier
- `WorkerName`: Worker name
- `Skills`: Comma-separated skills
- `AvailableSlots`: JSON array of available phases
- `MaxLoadPerPhase`: Maximum workload per phase
- `WorkerGroup`: Worker grouping
- `QualificationLevel`: Skill level

#### Tasks
- `TaskID`: Unique identifier
- `TaskName`: Task name
- `Category`: Task category
- `Duration`: Number of phases required
- `RequiredSkills`: Comma-separated required skills
- `PreferredPhases`: Preferred execution phases
- `MaxConcurrent`: Maximum parallel assignments

## 🔍 Validation Rules

The application implements 12+ validation rules:

1. **Missing Required Columns**: Ensures all required fields are present
2. **Duplicate IDs**: Prevents duplicate identifiers
3. **Malformed Lists**: Validates JSON arrays and comma-separated values
4. **Out-of-Range Values**: Checks priority levels and durations
5. **Broken JSON**: Validates JSON syntax in attributes
6. **Unknown References**: Ensures task IDs exist
7. **Circular Co-run Groups**: Detects circular dependencies
8. **Phase Window Constraints**: Validates phase specifications
9. **Overloaded Workers**: Checks workload capacity
10. **Phase Slot Saturation**: Validates resource availability
11. **Skill Coverage**: Ensures required skills are available
12. **Max Concurrency Feasibility**: Validates parallel execution limits

## 🎯 Business Rules

### Rule Types
- **Co-run Rules**: Tasks that must run together
- **Slot Restrictions**: Limit slots for specific groups
- **Load Limits**: Maximum workload per worker group
- **Phase Windows**: Restrict tasks to specific phases
- **Pattern Matching**: Apply rules based on patterns
- **Precedence Overrides**: Override global precedence

### Natural Language Examples
- "Tasks T12 and T14 must run together"
- "Limit sales workers to 3 slots per phase"
- "Task T15 can only run in phases 1-3"
- "Premium clients get priority 5"

## ⚖️ Prioritization System

### Preset Profiles
- **Maximize Fulfillment**: Complete as many tasks as possible
- **Fair Distribution**: Ensure fair workload distribution
- **Minimize Workload**: Reduce overall workload and stress
- **Cost Optimized**: Minimize costs while maintaining quality
- **Speed Optimized**: Complete tasks as quickly as possible

### Custom Weights
- Priority Level (0-100%)
- Task Fulfillment (0-100%)
- Fairness (0-100%)
- Cost Optimization (0-100%)
- Speed Optimization (0-100%)
- Skill Utilization (0-100%)

## 📤 Export Features

The application exports:
- **Cleaned CSV Files**: `clients-cleaned.csv`, `workers-cleaned.csv`, `tasks-cleaned.csv`
- **Business Rules**: `business-rules.json` with all rules and configuration
- **Export Report**: `export-report.json` with summary and next steps

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Responsive Layout**: Works on desktop and mobile
- **Real-time Feedback**: Immediate validation and suggestions
- **Intuitive Navigation**: Tab-based workflow
- **Visual Indicators**: Color-coded validation results
- **Interactive Elements**: Hover effects and transitions

## 🔧 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Adding New Features
1. Create components in `src/components/`
2. Add types in `src/types/`
3. Update validation in `src/lib/validation.ts`
4. Add state management in `src/store/DataStore.ts`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the validation panel for data issues
- Review the sample files for data format
- Use the AI suggestions for guidance
- Export and review the generated files

---

**Data Alchemist** - Transforming spreadsheet chaos into allocation clarity with AI-powered intelligence.

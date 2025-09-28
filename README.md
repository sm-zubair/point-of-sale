# Point of Sale System

A modern, feature-rich Point of Sale (POS) system built with Next.js, TypeScript, and Prisma. This application provides a complete solution for managing sales, inventory, staff, and financial operations in a restaurant or retail environment.

## 🚀 Features

### Core Functionality
- **Shift Management**: Open/close shifts with opening/closing balances and staff assignment
- **Order Management**: Create, process, and track orders with detailed item breakdowns
- **Inventory Management**: Manage products, categories, and pricing
- **Staff Management**: Handle employee information, commissions, and serving status
- **Financial Tracking**: Comprehensive ledger system with detailed transaction records
- **Customer Management**: Track unique customers and their order history
- **Discount System**: Flexible discount creation with auto-apply functionality

### Advanced Features
- **Multi-currency Support**: Built-in support for different denominations (5000, 1000, 500, 100, 50, 20, 10)
- **Real-time Statistics**: Sales analytics and performance metrics
- **Order Deletion Tracking**: Complete audit trail for deleted orders with reasons
- **Database Views**: Optimized views for ledger and statistics reporting
- **Authentication**: Staff-based authentication and authorization system
- **Responsive UI**: Modern, mobile-friendly interface built with PrimeReact

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.4.6**: React framework with server-side rendering
- **React 19.1.1**: Modern React with latest features
- **TypeScript 5.9.2**: Type-safe JavaScript
- **PrimeReact 10.9.7**: Enterprise-grade UI component library
- **PrimeIcons 7.0.0**: Comprehensive icon library
- **Tailwind CSS 4.1.12**: Utility-first CSS framework
- **Formik 2.4.6**: Form management and validation
- **Yup 1.7.0**: Schema validation

### Backend & Database
- **Prisma 6.15.0**: Next-generation ORM for database management
- **Prisma Client 6.16.2**: Type-safe database client
- **MySQL**: Primary database (configured via environment variables)
- **Server Actions**: Next.js server actions for API endpoints

### Development Tools
- **PNPM**: Fast, disk space efficient package manager
- **Prettier**: Code formatting with Tailwind CSS plugin
- **PostCSS**: CSS transformation tool
- **Autoprefixer**: CSS vendor prefixing

## 📊 Database Schema

The application uses a comprehensive database schema with the following main entities:

### Core Tables
- **shifts**: Manages work shifts with opening/closing balances and staff assignment
- **orders**: Primary order records with payment and status tracking
- **order_details**: Detailed line items for each order
- **items**: Product catalog with pricing and categorization
- **categories**: Product categorization system with hierarchical support
- **staff**: Employee management with commission tracking
- **accounts**: Financial account management
- **discounts**: Flexible discount system with auto-apply functionality

### Supporting Tables
- **deleted_orders**: Audit trail for deleted orders
- **ledger**: Comprehensive financial transaction records
- **statistics**: Aggregated sales and performance data
- **migrations**: Database migration tracking

### Database Views
- **viewLedger**: Optimized view for financial reporting
- **viewStatistics**: Aggregated statistics for analytics

## 🏗️ Project Structure

```
point-of-sale/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── admin/             # Admin dashboard routes
│   │   │   ├── accounts/      # Account management
│   │   │   ├── categories/    # Category management
│   │   │   ├── dashboard/     # Admin dashboard
│   │   │   ├── discounts/     # Discount management
│   │   │   ├── items/         # Item management
│   │   │   └── staff/         # Staff management
│   │   ├── bill/              # Billing interface
│   │   ├── pos/               # Point of Sale interface
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page (shift management)
│   ├── components/            # Reusable React components
│   │   ├── auth-context.tsx   # Authentication context
│   │   └── notification.tsx   # Notification system
│   ├── actions.ts             # Server actions (API functions)
│   ├── constants/             # Application constants
│   ├── database/              # Database utilities
│   ├── helpers/               # Utility functions
│   └── global.css             # Global styles
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── public/                    # Static assets
├── .env                       # Environment variables
├── .gitignore                 # Git ignore rules
├── .prettierrc                # Prettier configuration
├── next-env.d.ts             # Next.js type definitions
├── package.json              # Dependencies and scripts
├── pnpm-lock.yaml            # PNPM lock file
├── pnpm-workspace.yaml       # PNPM workspace configuration
├── postcss.config.mjs        # PostCSS configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PNPM package manager
- MySQL database
- Environment variables configured

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd point-of-sale
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/database_name"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   pnpm prisma generate
   
   # Run database migrations
   pnpm prisma db push
   # or
   pnpm prisma migrate dev
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm prisma generate` - Generate Prisma client
- `pnpm prisma db push` - Push schema changes to database
- `pnpm prisma migrate dev` - Create and apply database migrations

## 🎯 Usage Guide

### Shift Management
1. **Opening a Shift**: 
   - Select staff member
   - Enter opening balance by counting different denominations
   - Confirm and open shift

2. **Closing a Shift**:
   - Count closing balance
   - Enter closing amounts
   - System calculates variance and generates reports

### Order Processing
1. **Creating Orders**:
   - Select items from categorized menu
   - Apply discounts if applicable
   - Choose payment method
   - Complete order

2. **Order Management**:
   - View order history
   - Track order status
   - Handle order modifications and cancellations

### Admin Dashboard
Access the admin panel at `/admin` to manage:
- **Items**: Add, edit, remove products
- **Categories**: Organize products into categories
- **Staff**: Manage employees and commissions
- **Accounts**: Handle financial accounts
- **Discounts**: Create and manage discount rules
- **Dashboard**: View analytics and reports

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL`: MySQL database connection string

### Prisma Configuration
- Database provider: MySQL
- Client: Prisma Client JS
- Preview features: Views enabled

### TypeScript Configuration
- Target: ES2017
- Strict mode: Disabled (for flexibility)
- Decorators: Enabled for experimental features
- JSX: Preserve

### Code Style
- Prettier with Tailwind CSS plugin
- Single quotes, 2-space indentation
- Trailing commas, 120-character line width

## 📱 UI/UX Features

### Design System
- **PrimeReact Components**: Enterprise-grade UI components
- **Responsive Design**: Mobile-first approach
- **Dark/Light Theme**: Built-in theme support
- **Accessibility**: WCAG compliant components

### Key UI Components
- **Dialog**: Modal dialogs for forms and confirmations
- **Dropdown**: Select components with search functionality
- **InputText**: Form inputs with validation
- **Button**: Action buttons with various styles
- **Fieldset**: Grouped form sections
- **Divider**: Visual separators
- **Notification**: Toast notifications for user feedback

## 🔒 Security Features

### Authentication
- Staff-based authentication system
- Session management
- Role-based access control

### Data Protection
- Input validation with Yup schemas
- Type-safe database operations with Prisma
- SQL injection prevention
- XSS protection through React's built-in safeguards

## 📈 Analytics & Reporting

### Built-in Reports
- **Shift Reports**: Opening/closing balances, variance analysis
- **Sales Reports**: Revenue, discounts, commissions
- **Staff Performance**: Individual sales and commission tracking
- **Inventory Reports**: Product performance and categorization

### Real-time Statistics
- Dashboard with key metrics
- Live order tracking
- Financial summaries
- Performance indicators

## 🚀 Performance Optimizations

### Frontend
- Next.js server-side rendering
- Code splitting and lazy loading
- Optimized bundle size
- Image optimization

### Backend
- Prisma query optimization
- Database indexing
- Efficient data fetching
- Caching strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the established code style
- Use TypeScript for type safety
- Write clear, descriptive commit messages
- Test thoroughly before submitting
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review existing issues and discussions

## 🔄 Changelog

### Version 0.1.0
- Initial release
- Core POS functionality
- Shift management
- Order processing
- Admin dashboard
- Staff management
- Inventory management
- Financial tracking
- Responsive UI

---

Built with ❤️ using Next.js, TypeScript, and Prisma

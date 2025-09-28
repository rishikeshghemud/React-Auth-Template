#!/usr/bin/env node

/**
 * 🚀 Auth Template Setup Script
 * 
 * This script helps you create a new project using the React + Node.js Auth Template
 * 
 * Usage: node setup-new-project.js <project-name>
 * Example: node setup-new-project.js my-awesome-app
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get project name from command line arguments
const projectName = process.argv[2];

if (!projectName) {
    console.log('❌ Please provide a project name');
    console.log('Usage: node setup-new-project.js <project-name>');
    console.log('Example: node setup-new-project.js my-awesome-app');
    process.exit(1);
}

console.log(`🚀 Creating new project: ${projectName}`);

// Generate random JWT secrets
function generateSecret(length = 64) {
    return require('crypto').randomBytes(length).toString('hex');
}

// Replace content in files
function replaceInFile(filePath, replacements) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        for (const [search, replace] of Object.entries(replacements)) {
            content = content.replace(new RegExp(search, 'g'), replace);
        }
        
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated ${filePath}`);
    }
}

try {
    // 1. Copy template to new directory
    console.log('📁 Copying template files...');
    const currentDir = __dirname;
    const newProjectDir = path.join(path.dirname(currentDir), projectName);
    
    if (fs.existsSync(newProjectDir)) {
        console.log('❌ Project directory already exists!');
        process.exit(1);
    }
    
    // Copy all files except node_modules and .git
    execSync(`xcopy "${currentDir}" "${newProjectDir}" /E /I /H /Y /EXCLUDE:node_modules`);
    
    // 2. Generate new JWT secrets
    const accessSecret = generateSecret();
    const refreshSecret = generateSecret();
    
    // 3. Update package.json files
    console.log('📦 Updating package.json files...');
    
    // Server package.json
    replaceInFile(path.join(newProjectDir, 'server', 'package.json'), {
        '"name": "server"': `"name": "${projectName}-server"`
    });
    
    // Client package.json
    replaceInFile(path.join(newProjectDir, 'client', 'package.json'), {
        '"name": "vite_react_shadcn_ts"': `"name": "${projectName}-client"`
    });
    
    // 4. Update environment files
    console.log('🔐 Setting up environment variables...');
    
    // Server .env
    replaceInFile(path.join(newProjectDir, 'server', '.env'), {
        'JWT_SECRET_KEY=.*': `JWT_SECRET_KEY=${accessSecret}`,
        'JWT_REFRESH_KEY=.*': `JWT_REFRESH_KEY=${refreshSecret}`,
        'ChatApp': `${projectName.charAt(0).toUpperCase() + projectName.slice(1)}DB`
    });
    
    // 5. Update app branding
    console.log('🎨 Updating app branding...');
    
    const appTitle = projectName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    // Update Dashboard title
    replaceInFile(path.join(newProjectDir, 'client', 'src', 'pages', 'Dashboard.tsx'), {
        'Chat App': appTitle
    });
    
    // Update Login/Register titles
    replaceInFile(path.join(newProjectDir, 'client', 'src', 'pages', 'AuthPages', 'Login.tsx'), {
        'Chat App': appTitle
    });
    
    replaceInFile(path.join(newProjectDir, 'client', 'src', 'pages', 'AuthPages', 'Register.tsx'), {
        'Join our chat community today': `Welcome to ${appTitle}!`
    });
    
    // Update HTML title
    replaceInFile(path.join(newProjectDir, 'client', 'index.html'), {
        '<title>.*</title>': `<title>${appTitle}</title>`
    });
    
    // 6. Clean up template-specific files
    console.log('🧹 Cleaning up template files...');
    const filesToRemove = [
        path.join(newProjectDir, 'setup-new-project.js'),
        path.join(newProjectDir, 'TEMPLATE_GUIDE.md')
    ];
    
    filesToRemove.forEach(file => {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
            console.log(`🗑️ Removed ${file}`);
        }
    });
    
    // 7. Create project-specific README
    const readmeContent = `# ${appTitle}

A modern web application with secure authentication.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB (local or cloud)

### Setup

1. **Install server dependencies:**
   \`\`\`bash
   cd server
   npm install
   \`\`\`

2. **Install client dependencies:**
   \`\`\`bash
   cd ../client
   npm install
   \`\`\`

3. **Configure environment variables:**
   - Update \`server/.env\` with your MongoDB URI
   - Client environment is already configured

4. **Start development servers:**
   
   **Terminal 1 (Server):**
   \`\`\`bash
   cd server
   npm start
   \`\`\`
   
   **Terminal 2 (Client):**
   \`\`\`bash
   cd client
   npm run dev
   \`\`\`

5. **Open your browser:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8001

## 🔐 Features

- ✅ Secure JWT Authentication
- ✅ User Registration & Login
- ✅ Protected Routes
- ✅ Modern UI with Tailwind CSS
- ✅ Real-time Form Validation
- ✅ Toast Notifications
- ✅ Responsive Design
- ✅ TypeScript Support

## 🛠️ Built With

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui Components
- React Router
- Vite

### Backend
- Node.js
- Express.js
- MongoDB
- JWT
- Bcrypt
- TypeScript

## 📁 Project Structure

\`\`\`
${projectName}/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   └── types/
│   └── package.json
├── server/          # Node.js backend  
│   ├── src/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── dbUtils/
│   └── package.json
└── README.md
\`\`\`

## 🚀 Deployment

### Frontend (Vercel/Netlify)
\`\`\`bash
cd client
npm run build
# Deploy dist/ folder
\`\`\`

### Backend (Railway/Heroku)
\`\`\`bash
cd server
# Set environment variables on platform
# Deploy directly
\`\`\`

## 📝 License

MIT License - feel free to use this project for personal or commercial use.

---

Built with ❤️ using React + Node.js Auth Template
`;

    fs.writeFileSync(path.join(newProjectDir, 'README.md'), readmeContent);
    
    console.log('🎉 Project setup complete!');
    console.log('');
    console.log(`📁 Project created at: ${newProjectDir}`);
    console.log('');
    console.log('🚀 Next steps:');
    console.log(`1. cd ${projectName}`);
    console.log('2. Update server/.env with your MongoDB URI');
    console.log('3. cd server && npm install');
    console.log('4. cd ../client && npm install');
    console.log('5. Start development: npm start (server) & npm run dev (client)');
    console.log('');
    console.log('✨ Happy coding!');
    
} catch (error) {
    console.error('❌ Error setting up project:', error.message);
    process.exit(1);
}
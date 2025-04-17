const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Sample product data
const sampleProducts = [
  {
    name: 'Syntax Error Shield',
    description: 'Protect your code from syntax errors with real-time detection and correction.',
    price: '19.99',
    image: 'https://placehold.co/300x200?text=Syntax+Error+Shield',
    category: 'Error Protection'
  },
  {
    name: 'Infinite Loop Guard',
    description: 'Prevent infinite loops from crashing your application with smart loop analysis.',
    price: '24.99',
    image: 'https://placehold.co/300x200?text=Loop+Guard',
    category: 'Error Protection'
  },
  {
    name: 'Undefined Variable Protector',
    description: 'Identify and fix undefined variables before they cause runtime errors.',
    price: '29.99',
    image: 'https://placehold.co/300x200?text=Variable+Protector',
    category: 'Error Protection'
  },
  {
    name: 'CSS Conflict Resolver',
    description: 'Resolve CSS conflicts and ensure your styles apply correctly.',
    price: '15.99',
    image: 'https://placehold.co/300x200?text=CSS+Resolver',
    category: 'Styling Repair'
  },
  {
    name: 'Callback Hell Rescuer',
    description: 'Transform nested callbacks into clean, readable async/await code.',
    price: '34.99',
    image: 'https://placehold.co/300x200?text=Callback+Rescuer',
    category: 'Code Quality'
  },
  {
    name: 'Memory Leak Fixer',
    description: 'Detect and fix memory leaks to keep your application running smoothly.',
    price: '49.99',
    image: 'https://placehold.co/300x200?text=Memory+Fixer',
    category: 'Performance Repair'
  },
  {
    name: 'Code Formatter',
    description: 'Automatically format your code to improve readability and maintain consistency.',
    price: '9.99',
    image: 'https://placehold.co/300x200?text=Code+Formatter',
    category: 'Code Quality'
  },
  {
    name: 'Error Logger',
    description: 'Log errors with detailed stack traces to help you debug faster.',
    price: '14.99',
    image: 'https://placehold.co/300x200?text=Error+Logger',
    category: 'Debugging Tools'
  },
  {
    name: 'Performance Profiler',
    description: 'Profile your application to find performance bottlenecks.',
    price: '39.99',
    image: 'https://placehold.co/300x200?text=Performance+Profiler',
    category: 'Performance Repair'
  },
  {
    name: 'Security Scanner',
    description: 'Scan your code for security vulnerabilities.',
    price: '59.99',
    image: 'https://placehold.co/300x200?text=Security+Scanner',
    category: 'Security'
  },
  {
    name: 'Accessibility Checker',
    description: 'Ensure your web applications are accessible to all users.',
    price: '19.99',
    image: 'https://placehold.co/300x200?text=Accessibility+Checker',
    category: 'Accessibility'
  },
  {
    name: 'Responsive Design Tester',
    description: 'Test your website on different screen sizes and devices.',
    price: '29.99',
    image: 'https://placehold.co/300x200?text=Responsive+Tester',
    category: 'Design Tools'
  },
  {
    name: 'Unit Test Generator',
    description: 'Generate unit tests for your functions automatically.',
    price: '24.99',
    image: 'https://placehold.co/300x200?text=Unit+Test+Generator',
    category: 'Testing Tools'
  },
  {
    name: 'Code Complexity Analyzer',
    description: 'Analyze your code to find complex and hard-to-maintain areas.',
    price: '19.99',
    image: 'https://placehold.co/300x200?text=Complexity+Analyzer',
    category: 'Code Quality'
  },
  {
    name: 'Dependency Checker',
    description: 'Check for outdated or vulnerable dependencies in your project.',
    price: '14.99',
    image: 'https://placehold.co/300x200?text=Dependency+Checker',
    category: 'Security'
  },
  {
    name: 'Code Coverage Reporter',
    description: 'Generate reports to see how much of your code is covered by tests.',
    price: '29.99',
    image: 'https://placehold.co/300x200?text=Coverage+Reporter',
    category: 'Testing Tools'
  },
  {
    name: 'API Mocking Tool',
    description: 'Mock APIs to test your application without hitting the real endpoints.',
    price: '34.99',
    image: 'https://placehold.co/300x200?text=API+Mocking+Tool',
    category: 'Testing Tools'
  },
  {
    name: 'Data Migration Assistant',
    description: 'Assist in migrating data between different databases.',
    price: '49.99',
    image: 'https://placehold.co/300x200?text=Migration+Assistant',
    category: 'Database Tools'
  },
  {
    name: 'GraphQL Explorer',
    description: 'Explore and test your GraphQL APIs with ease.',
    price: '19.99',
    image: 'https://placehold.co/300x200?text=GraphQL+Explorer',
    category: 'API Tools'
  },
  {
    name: 'Docker Image Optimizer',
    description: 'Optimize your Docker images to reduce size and improve performance.',
    price: '39.99',
    image: 'https://placehold.co/300x200?text=Docker+Optimizer',
    category: 'DevOps Tools'
  },
  {
    name: 'Continuous Integration Setup',
    description: 'Set up continuous integration pipelines for your projects.',
    price: '59.99',
    image: 'https://placehold.co/300x200?text=CI+Setup',
    category: 'DevOps Tools'
  },
  {
    name: 'Load Testing Suite',
    description: 'Test your application under heavy load to ensure stability.',
    price: '49.99',
    image: 'https://placehold.co/300x200?text=Load+Testing+Suite',
    category: 'Performance Repair'
  },
  {
    name: 'Version Control Helper',
    description: 'Manage your version control systems more effectively.',
    price: '19.99',
    image: 'https://placehold.co/300x200?text=Version+Control+Helper',
    category: 'DevOps Tools'
  },
  {
    name: 'Static Site Generator',
    description: 'Generate static sites from your dynamic web applications.',
    price: '29.99',
    image: 'https://placehold.co/300x200?text=Static+Site+Generator',
    category: 'Web Development'
  },
  {
    name: 'SEO Optimizer',
    description: 'Optimize your website for search engines to improve visibility.',
    price: '39.99',
    image: 'https://placehold.co/300x200?text=SEO+Optimizer',
    category: 'Marketing Tools'
  },
  {
    name: 'Email Campaign Manager',
    description: 'Manage and automate your email marketing campaigns.',
    price: '44.99',
    image: 'https://placehold.co/300x200?text=Email+Campaign+Manager',
    category: 'Marketing Tools'
  },
];

// Create a new PostgreSQL client
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

// Verify that the DATABASE_URL is loaded correctly
console.log('Database URL:', process.env.DATABASE_URL);

async function insertProducts() {
  try {
    await client.connect();
    console.log('Connected to the database');

    for (const product of sampleProducts) {
      const { name, description, price, image, category } = product;
      const query = `
        INSERT INTO products (name, description, price, image, category)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const values = [name, description, price, image, category];

      const res = await client.query(query, values);
      console.log('Inserted product:', res.rows[0]);
    }
  } catch (err) {
    console.error('Error inserting products:', err);
  } finally {
    await client.end();
    console.log('Disconnected from the database');
  }
}

insertProducts(); 
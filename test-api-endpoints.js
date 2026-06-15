// Test if the API routes are working
const testEndpoints = async () => {
    console.log('Testing API endpoints on your live site...\\n');
    
    const endpoints = [
        { url: '/api/courses', name: 'Courses API' },
        { url: '/api/jobs', name: 'Jobs API' },
        { url: '/api/funding', name: 'Funding API' },
        { url: '/api/shop/products', name: 'Products API' }
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Testing: ${endpoint.name}`);
            const response = await fetch(\`https://deliteproductions.vercel.app\${endpoint.url}\`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(\`? \${endpoint.name}: \${data.length || 'No'} items returned\\n\`);
            } else {
                console.log(\`? \${endpoint.name}: \${response.status} \${response.statusText}\\n\`);
            }
        } catch (error) {
            console.log(\`? \${endpoint.name}: \${error.message}\\n\`);
        }
    }
};

testEndpoints();

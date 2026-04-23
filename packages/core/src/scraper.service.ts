// Assuming there are imports above

// ... other code ...

function parseJobsFromHtmlFallback(html) {
    // ... other logic ...

    const absolutizeUrl = (url) => {
        // Your logic to convert relative URLs to absolute
        return new URL(url, 'https://www.example.com').href;
    };

    // Use absolutizeUrl logic directly here
    const absoluteUrl = absolutizeUrl(relativeJobUrl);

    // ... rest of your logic ...
}

// ... other code ...

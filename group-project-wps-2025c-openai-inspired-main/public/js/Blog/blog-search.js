// Blog Search Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Features search (sidebar)
    const featureSearchInput = document.getElementById('featureSearch');
    const featureCards = document.querySelectorAll('.feature-card');
        featureSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            featureCards.forEach(card => {
                const title = card.querySelector('.h6')?.textContent.toLowerCase() || '';
                const author = card.querySelector('.meta')?.textContent.toLowerCase() || '';
                const searchableText = title + ' ' + author;

                if (searchableText.includes(query)) {
                    card.parentElement.style.display = '';
                } else {
                    card.parentElement.style.display = 'none';
                }
            });

            // Show "no results" message if all feature cards are hidden
            const visibleFeatures = Array.from(featureCards).filter(card => 
                card.parentElement.style.display !== 'none'
            );

            const noFeaturesMsg = document.getElementById('noFeaturesMessage');
            if (noFeaturesMsg) {
                if (visibleFeatures.length === 0 && query.length > 0) {
                    noFeaturesMsg.style.display = 'block';
                } else {
                    noFeaturesMsg.style.display = 'none';
                }
            }
        });

    // Blog posts search (main section)
    const blogSearchInput = document.getElementById('blogSearch');
    const blogCards = document.querySelectorAll('.blog-card');

    if (blogSearchInput) {
        blogSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            window.dispatchEvent(new CustomEvent('blogSearchUpdate', {
                detail: { query: query }
            }));

            blogCards.forEach(card => {
                const title = card.querySelector('.blog-card-title')?.textContent.toLowerCase() || '';
                const meta = card.querySelector('.blog-card-meta')?.textContent.toLowerCase() || '';
                const searchableText = title + ' ' + meta;

                if (searchableText.includes(query)) {
                    card.closest('.col-md-6').style.display = '';
                } else {
                    card.closest('.col-md-6').style.display = 'none';
                }
            });

            // Show "no results" message if all cards are hidden
            const visibleCards = Array.from(blogCards).filter(card => 
                card.closest('.col-md-6').style.display !== 'none'
            );

            const noResultsMsg = document.getElementById('noResultsMessage');
            if (noResultsMsg) {
                if (visibleCards.length === 0 && query.length > 0) {
                    noResultsMsg.style.display = 'block';
                } else {
                    noResultsMsg.style.display = 'none';
                }
            }
        });
    }
});

// Blog Sort Functionality
document.addEventListener('DOMContentLoaded', () => {
    const blogCardsContainer = document.getElementById('blog-posts-container');
    let blogPostsData = [];
    let currentSearchQuery = '';

    // Initialize blog posts data from DOM
    const initializeBlogPosts = () => {
        const blogCards = document.querySelectorAll('.blog-card');
        blogPostsData = Array.from(blogCards).map((card, index) => {
            const cardElement = card.closest('.col-md-6, .col-lg-4') || card;
            const title = card.dataset.title || card.querySelector('.blog-card-title')?.textContent || '';
            const meta = card.querySelector('.blog-card-meta')?.textContent || '';
            const image = card.querySelector('.blog-card-image img')?.getAttribute('src') || '';
            const createdAt = Number(card.dataset.createdAt || 0) || 0;
            const likes = Number(card.dataset.likes || 0) || 0;

            return {
                element: cardElement,
                title,
                meta,
                image,
                createdAt,
                likes,
                originalIndex: index,
                html: cardElement.outerHTML
            };
        });
    };

    initializeBlogPosts();

    window.addEventListener('blogSearchUpdate', (e) => {
        currentSearchQuery = e.detail.query;
    });

    // Sort functionality
    const sortDropdownItems = document.querySelectorAll('.blog-dropdown .dropdown-item');
    const selectedSortOption = document.getElementById('selectedSortOption');

    const sortBlogPosts = (sortType) => {
        if (!blogCardsContainer) {
            console.error('Blog container not found!');
            return;
        }
        
        if (blogPostsData.length === 0) {
            return;
        }
        
        let sortedPosts = [...blogPostsData];

        switch (sortType) {
            case 'Newest First':
                sortedPosts.sort((a, b) => (b.createdAt - a.createdAt) || (a.originalIndex - b.originalIndex));
                break;
            case 'Oldest First':
                sortedPosts.sort((a, b) => (a.createdAt - b.createdAt) || (a.originalIndex - b.originalIndex));
                break;
            case 'Most Liked':
                sortedPosts.sort((a, b) => (b.likes - a.likes) || (b.createdAt - a.createdAt) || (a.originalIndex - b.originalIndex));
                break;
        }

        const container = blogCardsContainer;
        container.innerHTML = '';

        sortedPosts.forEach(post => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = post.html;
            const newElement = tempDiv.firstElementChild;
            
            if (currentSearchQuery) {
                const title = post.title.toLowerCase();
                const meta = post.meta.toLowerCase();
                const searchableText = title + ' ' + meta;
                
                if (!searchableText.includes(currentSearchQuery)) {
                    newElement.style.display = 'none';
                }
            }
            
            container.appendChild(newElement);
            post.element = newElement;
        });

        const noResultsMsg = document.getElementById('noResultsMessage');
        if (noResultsMsg) {
            const visibleCards = sortedPosts.filter(post => 
                post.element.style.display !== 'none'
            );
            noResultsMsg.style.display = visibleCards.length === 0 ? 'block' : 'none';
        }

        if (selectedSortOption) {
            selectedSortOption.textContent = sortType;
        }
    };

    sortDropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); 
            
            const sortType = item.getAttribute('data-value');
            console.log('Sort clicked:', sortType);
            sortBlogPosts(sortType);
            
            // Update active state
            sortDropdownItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Close the dropdown
            const dropdown = document.getElementById('blogSortDropdown');
            if (dropdown) {
                const bsDropdown = bootstrap.Dropdown.getInstance(dropdown);
                if (bsDropdown) bsDropdown.hide();
            }
            
            return false; // Extra safety to prevent navigation
        });
    });

    if (sortDropdownItems.length > 0) {
        sortDropdownItems[0].classList.add('active');
    }
});

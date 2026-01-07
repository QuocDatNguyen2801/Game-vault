document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname.replace(/\/$/, "");
    const navLinks = document.querySelectorAll(".nav-link");

    // Highlight active navigation link
    navLinks.forEach(link => {
        const linkPath = link.getAttribute("href").replace(/\/$/, "");

        if (linkPath === "") {
            if (currentPath === "" || currentPath === "/") {
                link.classList.add("active-link");
            } else {
                link.classList.remove("active-link");
            }
        } else if (currentPath === linkPath || currentPath.startsWith(linkPath + "/")) {
            link.classList.add("active-link");
        } else {
            link.classList.remove("active-link");
        }
    });

    document.querySelectorAll('.customize-edition-options').forEach(button => {
        const dropdown = button.closest('.dropdown'); 
        const selectedText = button.querySelector('span'); 
        const items = dropdown.querySelectorAll('.edition-dropdown .dropdown-item');
        const hiddenInput = dropdown.closest('form').querySelector('.edition-input');

        const form = dropdown.closest('form');
        const cardBody = button.closest('.card-body');
        const priceElement = cardBody ? cardBody.querySelector('.livePrice') : null;

        if (priceElement && !priceElement.hasAttribute('data-base-price')) {
            priceElement.setAttribute('data-base-price', priceElement.textContent.trim());
        }

        items.forEach(item => {
            item.addEventListener('click', function (e) {
                e.preventDefault();

                items.forEach(i => i.classList.remove('selected'));
                this.classList.add('selected');

                const value = this.getAttribute('data-value');

                selectedText.textContent = this.dataset.value || this.textContent.trim();
                hiddenInput.value = value;

                if (priceElement) {
                    const basePrice = parseFloat(priceElement.getAttribute('data-base-price'));
                    let finalPrice = basePrice;

                    if (value === 'Deluxe') {
                        finalPrice += 10.00;
                    } else if (value === 'Ultimate') {
                        finalPrice += 20.00;
                    }

                    priceElement.textContent = finalPrice.toFixed(2);
                }
            });
        });

        const detailDropdownItems = document.querySelectorAll('.game-details-dropdown .dropdown-item');
        const detailPriceElement = document.getElementById('detailPagePrice');
        const detailSelectedText = document.getElementById('selectedEdition');
        const detailHiddenInput = document.getElementById('editionInput');

        if (detailDropdownItems.length > 0 && detailPriceElement) {
            detailDropdownItems.forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();

                    detailDropdownItems.forEach(i => i.classList.remove('selected'));
                    this.classList.add('selected');

                    const value = this.getAttribute('data-value');
                    detailSelectedText.textContent = value;
                    if (detailHiddenInput) {
                        detailHiddenInput.value = value;
                    }

                    const basePrice = parseFloat(detailPriceElement.getAttribute('data-base-price'));
                    let finalPrice = basePrice;

                    if (value === 'Deluxe') {
                        finalPrice += 10.00;
                    } else if (value === 'Ultimate') {
                        finalPrice += 20.00;
                    }

                    detailPriceElement.textContent = "$" + finalPrice.toFixed(2);
                });
            });
        }
    });


    const filterDropdownItems = document.querySelectorAll('.search-filter-dropdown .dropdown-item');
    const selectedSearchFilterSpan = document.getElementById('selectedSearchFilter');
    let selectedSearchFilter = null;
    
    filterDropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            filterDropdownItems.forEach(i => i.classList.remove('selected'));
            
            this.classList.add('selected');
            selectedSearchFilter = this;
            
            selectedSearchFilterSpan.textContent = this.textContent.trim();
        });
    });

    const navButtonsMobile = document.getElementById('navButtonsMobile');
    const navbarCollapse = document.getElementById('navbarNavDropdown');

    if (navbarCollapse && navButtonsMobile) {
        navButtonsMobile.classList.add('d-none');

        navbarCollapse.addEventListener('show.bs.collapse', function () {
            navButtonsMobile.classList.remove('d-none');
        });

        navbarCollapse.addEventListener('hide.bs.collapse', function () {
            navButtonsMobile.classList.add('d-none');
        });
    }
});
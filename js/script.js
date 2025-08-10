
// Dynamische Header-Höhe für Scroll-Offset
function updateScrollPadding() {
    const header = document.querySelector('.header');
    if (header) {
        const headerHeight = header.offsetHeight;
        document.documentElement.style.setProperty('scroll-padding-top', headerHeight + 'px');
    }
}

// Bei Seitenladen und Größenänderung aktualisieren
window.addEventListener('load', updateScrollPadding);
window.addEventListener('resize', updateScrollPadding);

// Smooth Scrolling für Anker-Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const header = document.querySelector('.header');
            const headerHeight = header ? header.offsetHeight : 0;
            const extraOffset = 0; // Zusätzlicher Abstand für bessere Sichtbarkeit
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - extraOffset;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Active Navigation Highlighting basierend auf Scroll-Position
function updateActiveNavigation() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav a[href^="#"]');
    const header = document.querySelector('.header');
    const headerHeight = header ? header.offsetHeight : 0;
    const scrollPosition = window.scrollY + headerHeight + 50; // +50 für bessere Erkennung

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            // Entferne active von allen Links
            navLinks.forEach(link => {
                link.classList.remove('active');
            });
            
            // Füge active zum entsprechenden Link hinzu
            const activeLink = document.querySelector(`.nav a[href="#${sectionId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    });
    
    // Wenn ganz oben, entferne alle active Klassen
    if (window.scrollY < 100) {
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
    }
}

// Event Listener für Scroll
window.addEventListener('scroll', updateActiveNavigation);
window.addEventListener('load', updateActiveNavigation);

// Einfache Formular-Behandlung
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Vielen Dank für Ihre Nachricht! Wir melden uns schnellstmöglichst bei Ihnen.');
        this.reset();
    });
}

// Modal Funktionalität
const serviceCards = document.querySelectorAll('.service-card[data-service]');
const modals = document.querySelectorAll('.modal');
const modalCloses = document.querySelectorAll('.modal-close');
const body = document.body;

// Legal Pages Funktionalität entfernt (Overlays aus index.html entfernt)

// Service Card Clicks & More Links  
serviceCards.forEach(card => {
    card.addEventListener('click', function(e) {
        // Prevent opening modal if clicking on the "more" link
        if (e.target.closest('.service-more-link')) {
            return;
        }
        
        const service = this.getAttribute('data-service');
        const modal = document.getElementById(`modal-${service}`);
        
        if (modal) {
            modal.classList.add('active');
            body.classList.add('modal-open');
        }
    });
});

// Service More Links
const serviceMoreLinks = document.querySelectorAll('.service-more-link');
serviceMoreLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const service = this.getAttribute('data-service');
        const modal = document.getElementById(`modal-${service}`);
        
        if (modal) {
            modal.classList.add('active');
            body.classList.add('modal-open');
        }
    });
});

// Modal Close Buttons
modalCloses.forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
        const modal = this.closest('.modal');
        modal.classList.remove('active');
        body.classList.remove('modal-open');
    });
});

// Click outside modal to close
modals.forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
            body.classList.remove('modal-open');
        }
    });
});

// Escape key to close modal or legal page
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        const activeLegalPage = document.querySelector('.legal-page.active');
        
        if (activeModal) {
            activeModal.classList.remove('active');
            body.classList.remove('modal-open');
        } else if (activeLegalPage) {
            activeLegalPage.classList.remove('active');
            body.classList.remove('modal-open');
        }
    }
});

// Modal CTA buttons - close modal and scroll to contact
document.querySelectorAll('.modal-cta .cta-button').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Close modal
        const modal = this.closest('.modal');
        modal.classList.remove('active');
        body.classList.remove('modal-open');
        
        // Scroll to contact section after modal closes
        setTimeout(() => {
            const contactSection = document.querySelector('#kontakt');
            if (contactSection) {
                contactSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 300);
    });
});

// Filter Funktionalität
document.addEventListener('DOMContentLoaded', function() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const referenceCards = document.querySelectorAll('.reference-card');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Aktive Tab aktualisieren
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Karten filtern
            referenceCards.forEach(card => {
                if (filter === 'alle' || card.getAttribute('data-category') === filter) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
});

// Vorher-Nachher Slider Funktionalität
function initBeforeAfterSliders() {
    const sliders = document.querySelectorAll('.before-after-container');
    
    sliders.forEach(container => {
        const slider = container.querySelector('.before-after-slider');
        const afterImage = container.querySelector('.after-image');
        let isDragging = false;
        
        function updateSlider(x) {
            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;
            let percentage = ((x - containerRect.left) / containerWidth) * 100;
            
            // Grenzen setzen
            percentage = Math.max(0, Math.min(100, percentage));
            
            // Slider Position aktualisieren
            slider.style.left = percentage + '%';
            
            // After-Image Clip-Path aktualisieren
            afterImage.style.clipPath = `polygon(${percentage}% 0, 100% 0, 100% 100%, ${percentage}% 100%)`;
        }
        
        // Mouse Events
        slider.addEventListener('mousedown', (e) => {
            isDragging = true;
            e.preventDefault();
        });
        
        container.addEventListener('mousemove', (e) => {
            if (isDragging) {
                updateSlider(e.clientX);
            }
        });
        
        container.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        container.addEventListener('mouseleave', () => {
            isDragging = false;
        });
        
        // Touch Events für Mobile
        slider.addEventListener('touchstart', (e) => {
            isDragging = true;
            e.preventDefault();
        });
        
        container.addEventListener('touchmove', (e) => {
            if (isDragging) {
                const touch = e.touches[0];
                updateSlider(touch.clientX);
                e.preventDefault();
            }
        });
        
        container.addEventListener('touchend', () => {
            isDragging = false;
        });
        
        // Click zum direkten Springen
        container.addEventListener('click', (e) => {
            if (!isDragging) {
                updateSlider(e.clientX);
            }
        });
        
        // Initial position (50%)
        updateSlider(container.getBoundingClientRect().left + (container.offsetWidth / 2));
    });
}

// Initialize sliders when page loads
document.addEventListener('DOMContentLoaded', initBeforeAfterSliders);

// Re-initialize after filter changes (in case sliders were hidden/shown)
document.addEventListener('DOMContentLoaded', function() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            setTimeout(initBeforeAfterSliders, 100);
        });
    });
});

// Lightbox Funktionalität
function openLightbox(card) {
    const lightbox = document.getElementById('lightbox');
    const imageContainer = lightbox.querySelector('.lightbox-image-container');
    const info = lightbox.querySelector('.lightbox-info');
    
    // Info-Bereich verstecken für reines Bild
    if (info) {
        info.style.display = 'none';
    }
    
    // Bild oder Vorher-Nachher Container erstellen
    if (card.classList.contains('before-after')) {
        // Vorher-Nachher Slider
        const originalContainer = card.querySelector('.before-after-container');
        const beforeImg = originalContainer.querySelector('.before-image');
        const afterImg = originalContainer.querySelector('.after-image');
        
        imageContainer.innerHTML = `
            <div class="lightbox-before-after">
                <div class="before-after-container">
                    <img src="${beforeImg.src}" alt="${beforeImg.alt}" class="before-image">
                    <img src="${afterImg.src}" alt="${afterImg.alt}" class="after-image">
                    <div class="before-after-slider"></div>
                    <div class="before-after-labels">
                        <span class="before-label">Vorher</span>
                        <span class="after-label">Nachher</span>
                    </div>
                </div>
            </div>
        `;
        
        // Slider im Lightbox initialisieren
        setTimeout(() => {
            initBeforeAfterSliders();
        }, 100);
    } else {
        // Normales Bild
        const img = card.querySelector('.reference-image img');
        if (img) {
            imageContainer.innerHTML = `
                <img src="${img.src}" alt="${img.alt}" class="lightbox-image" style="max-width: 90vw; max-height: 90vh; object-fit: contain;">
            `;
        } else {
            // Platzhalter falls kein Bild vorhanden
            const placeholder = card.querySelector('.reference-placeholder');
            if (placeholder) {
                imageContainer.innerHTML = `
                    <div class="lightbox-placeholder">
                        <div class="placeholder-content">${placeholder.textContent}</div>
                    </div>
                `;
            }
        }
    }
    
    // Lightbox anzeigen mit Fade-Animation
    lightbox.style.display = 'flex';
    setTimeout(() => {
        lightbox.classList.add('active');
    }, 10);
    document.body.classList.add('modal-open');
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.classList.remove('modal-open');
    
    // Nach der Animation verstecken
    setTimeout(() => {
        lightbox.style.display = 'none';
    }, 300);
}

// Gallery Lightbox für Index.html
function openGalleryLightbox(galleryItem) {
    const lightbox = document.getElementById('lightbox');
    const imageContainer = lightbox.querySelector('.lightbox-image-container');
    const info = lightbox.querySelector('.lightbox-info');
    
    // Info-Bereich verstecken für reines Bild
    if (info) {
        info.style.display = 'none';
    }
    
    // Daten aus dem Gallery Item extrahieren
    const img = galleryItem.querySelector('img');
    
    // Bild in Lightbox anzeigen
    imageContainer.innerHTML = `
        <img src="${img.src}" alt="${img.alt}" class="lightbox-image" style="max-width: 90vw; max-height: 90vh; object-fit: contain;">
    `;
    
    // Lightbox anzeigen mit Fade-Animation
    lightbox.style.display = 'flex';
    setTimeout(() => {
        lightbox.classList.add('active');
    }, 10);
    document.body.classList.add('modal-open');
}

// Event Listeners für Reference Cards und Gallery Items
document.addEventListener('DOMContentLoaded', function() {
    // Reference Cards (nur auf referenzen.html)
    const referenceCards = document.querySelectorAll('.reference-card');
    referenceCards.forEach(card => {
        card.addEventListener('click', function() {
            openLightbox(this);
        });
    });
    
    // Gallery Items (auf index.html)
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            openGalleryLightbox(this);
        });
    });
    
    // Lightbox schließen bei Klick außerhalb
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', function(e) {
            if (e.target === this) {
                closeLightbox();
            }
        });
        
        // ESC-Taste für Lightbox
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                closeLightbox();
            }
        });
    }
});


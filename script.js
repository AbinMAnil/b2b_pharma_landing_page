document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('sequence-canvas');
    const ctx = canvas.getContext('2d');
    
    let totalFrames = 240;
    const frames = [];
    const frameHeight = 12; // Adjusted for cinematic feel
    let loadedFrames = 0;
    
    const scrollSpacer = document.querySelector('.scroll-spacer');
    
    function updateScrollHeight() {
        const maxScroll = totalFrames * frameHeight;
        scrollSpacer.style.height = `${maxScroll}px`;
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        updateScrollHeight();
        if (frames.length > 0) renderFrame(currentFrameIndex);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const heroContent = document.querySelector('.hero-content');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    const loader = document.getElementById('loader');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    function getFramePath(index) {
        return `frames_v4/ezgif-frame-${index.toString().padStart(3, '0')}.png`;
    }

    // Preload frames
    for (let i = 1; i <= totalFrames; i++) {
        const img = new Image();
        img.src = getFramePath(i);
        
        img.onload = () => {
            loadedFrames++;
            updateProgress();
        };

        img.onerror = () => {
            loadedFrames++;
            updateProgress();
        };

        frames.push(img);
    }

    function updateProgress() {
        const percent = (loadedFrames / totalFrames) * 100;
        progressBar.style.width = `${percent}%`;
        progressText.innerText = `${Math.floor(percent)}%`;

        if (loadedFrames === totalFrames) {
            const validFrames = frames.filter(img => img.complete && img.naturalWidth > 0);
            frames.length = 0;
            frames.push(...validFrames);
            totalFrames = Math.max(1, frames.length);
            updateScrollHeight();

            setTimeout(() => {
                loader.classList.add('hidden');
                requestAnimationFrame(() => renderFrame(0));
            }, 800);
        }
    }

    function renderFrame(index) {
        const img = frames[index];
        if (!img || !img.complete || img.naturalWidth === 0) return;

        const canvasRatio = canvas.width / canvas.height;
        const imgRatio = img.width / img.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasRatio > imgRatio) {
            drawHeight = canvas.width / imgRatio;
            offsetY = (canvas.height - drawHeight) / 2;
            drawWidth = canvas.width;
            offsetX = 0;
        } else {
            drawWidth = canvas.height * imgRatio;
            offsetX = (canvas.width - drawWidth) / 2;
            drawHeight = canvas.height;
            offsetY = 0;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }

    let currentFrameIndex = 0;
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    function handleScroll() {
        const maxScroll = totalFrames * frameHeight;
        let scrollY = window.scrollY;

        // 1. Frame Sequence Animation
        let sequenceScrollY = Math.min(scrollY, maxScroll);
        let frameIndex = Math.floor((sequenceScrollY / maxScroll) * (totalFrames - 1));
        frameIndex = Math.max(0, frameIndex);

        if (frameIndex !== currentFrameIndex) {
            renderFrame(frameIndex);
            currentFrameIndex = frameIndex;
        }
        
        // 2. Hero Content Parallax and Fading
        const heroFadeEnd = 40 * frameHeight;
        if (scrollY < heroFadeEnd) {
            const opacity = 1 - (scrollY / heroFadeEnd);
            heroContent.style.opacity = opacity;
            scrollIndicator.style.opacity = opacity;
            heroContent.style.transform = `translateY(${scrollY * 0.4}px)`;
        } else {
            heroContent.style.opacity = 0;
            scrollIndicator.style.opacity = 0;
        }

        // Adjust background of canvas to fade as we hit content
        // We want to blend into white, so we fade the container background too
        const transitionPoint = maxScroll - (window.innerHeight * 0.8);
        const canvasContainer = document.querySelector('.canvas-container');

        if (scrollY > transitionPoint) {
            const progress = Math.min((scrollY - transitionPoint) / (window.innerHeight * 0.8), 1);
            
            // Fade the canvas images
            canvas.style.opacity = 1 - progress;
            canvas.style.filter = `blur(${progress * 10}px)`;

            // AND transition the fixed container background from black to white
            if (canvasContainer) {
                // Interpolate from #030508 to #ffffff
                // For simplicity, we can just transition background-color
                canvasContainer.style.backgroundColor = `rgba(255, 255, 255, ${progress})`;
                // If progress is high, make it purely white
                if (progress > 0.9) canvasContainer.style.background = '#ffffff';
            }
        } else {
            canvas.style.opacity = 1;
            canvas.style.filter = 'none';
            if (canvasContainer) {
                canvasContainer.style.background = 'var(--hero-bg)';
            }
        }
    }

    // --- 3D Methodology Carousel ---
    const methodologySection = document.querySelector('.methodology-system');
    const cards = gsap.utils.toArray('.m-card');
    
    // Only initialize complex 3D carousel on Desktop
    if (methodologySection && cards.length > 0 && window.innerWidth > 768) {
        gsap.registerPlugin(ScrollTrigger);

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: methodologySection,
                start: "top top",
                end: "bottom bottom",
                scrub: 1,
                pin: ".methodology-container",
                anticipatePin: 1
            }
        });

        // Radius for the circular orbiter
        const radius = window.innerWidth > 768 ? 600 : 220;
        
        cards.forEach((card, i) => {
            const icon = card.querySelector('.floating-3d-icon');
            const angleStep = 90;
            const initialAngle = i * angleStep;

            const getPos = (angle) => {
                const rad = angle * (Math.PI / 180);
                return {
                    x: Math.sin(rad) * radius,
                    z: -Math.abs(Math.cos(rad) * radius * 1.5),
                    y: Math.cos(rad) * radius * 0.2,
                    rotationY: -angle * 0.5
                };
            };

            const start = getPos(initialAngle);
            const startFocused = initialAngle === 0;

            gsap.set(card, {
                x: start.x,
                y: start.y,
                z: start.z,
                rotationY: start.rotationY,
                opacity: startFocused ? 1 : 0.4,
                scale: startFocused ? 1.2 : 0.8,
                visibility: 'visible'
            });

            if (icon) {
                gsap.set(icon, {
                    x: 0, y: 0,
                    top: startFocused ? "-20%" : "50%",
                    left: startFocused ? "110%" : "50%",
                    opacity: startFocused ? 1 : 0,
                    scale: startFocused ? 1.2 : 0.2,
                    xPercent: -50, yPercent: -50
                });
            }

            for (let step = 1; step < cards.length; step++) {
                const currentAngle = initialAngle - (step * angleStep);
                const pos = getPos(currentAngle);
                const isFocused = currentAngle === 0;

                tl.to(card, {
                    x: pos.x,
                    y: pos.y,
                    z: pos.z,
                    rotationY: pos.rotationY,
                    opacity: isFocused ? 1 : 0.3,
                    scale: isFocused ? 1.2 : 0.7,
                    duration: 2,
                    ease: "power3.inOut"
                }, (step - 1) * 3);

                if (icon) {
                    tl.to(icon, {
                        top: isFocused ? "-20%" : "50%",
                        left: isFocused ? "110%" : "50%",
                        opacity: isFocused ? 1 : 0,
                        scale: isFocused ? 1.2 : 0.2,
                        duration: 2,
                        ease: "power3.inOut"
                    }, (step - 1) * 3);
                }
            }
        });
    }

    // --- Strategy Side Scrolling GSAP ---
    const strategyBlocks = document.querySelectorAll('.strategy-text-block');
    const stickyImages = document.querySelectorAll('.strategy-img');

    if (strategyBlocks.length > 0 && stickyImages.length > 0) {
        gsap.registerPlugin(ScrollTrigger);
        
        ScrollTrigger.create({
            trigger: '.strategy-container',
            pin: '.strategy-right',
            start: "top top",
            end: "bottom bottom"
        });

        gsap.set(stickyImages[0], { y: '0%', opacity: 1, zIndex: 2 });
        for (let i = 1; i < stickyImages.length; i++) {
            gsap.set(stickyImages[i], { y: '0%', opacity: 0, zIndex: 1 });
        }
        
        let currentIndex = 0;

        strategyBlocks.forEach((block, index) => {
            ScrollTrigger.create({
                trigger: block,
                start: "top center",
                end: "bottom center",
                toggleClass: "active-block",
                onEnter: () => swapImage(index),
                onEnterBack: () => swapImage(index),
            });
            
            gsap.fromTo(block, 
                { y: 50 }, 
                { y: 0, duration: 0.8, ease: "power2.out",
                  scrollTrigger: {
                      trigger: block,
                      start: "top 80%"
                  }
                }
            );
        });

        function swapImage(newIndex) {
            if (newIndex === currentIndex) return;
            
            const currentImg = stickyImages[currentIndex];
            const nextImg = stickyImages[newIndex];
            
            gsap.set(nextImg, { zIndex: 3, y: "0%" }); // ensure y is 0
            gsap.set(currentImg, { zIndex: 2 });
            
            gsap.to(nextImg, { opacity: 1, duration: 0.8, ease: "power2.inOut" });
            gsap.to(currentImg, { opacity: 0, duration: 0.8, ease: "power2.inOut" });
            
            setTimeout(() => {
                stickyImages.forEach((img, i) => {
                    if (i !== newIndex) {
                        gsap.set(img, { zIndex: 1, opacity: 0, y: "0%" });
                    }
                });
            }, 800);
            
            currentIndex = newIndex;
        }
    }

    // --- Feature Showcase Entrance ---
    const revealItems = document.querySelectorAll('.reveal-item');
    if (revealItems.length > 0) {
        revealItems.forEach((item) => {
            gsap.from(item, {
                y: 100,
                opacity: 0,
                duration: 1.2,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: item,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            });
            
            // Also animate bubbles slightly slower for depth
            const bubble = item.querySelector('.image-stat-bubble');
            if (bubble) {
                gsap.from(bubble, {
                    scale: 0.8,
                    opacity: 0,
                    x: 20,
                    duration: 1.5,
                    delay: 0.3,
                    ease: "elastic.out(1, 0.5)",
                    scrollTrigger: {
                        trigger: item,
                        start: "top 85%"
                    }
                });
            }
        });
    }

    // --- Intersection Observer for Modern Movements ---
    const animatedElements = document.querySelectorAll('.slide-from-left, .slide-from-right, .slide-from-top, .reveal-up');
    
    const revealOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                // observer.unobserve(entry.target); // Keep for re-entry if desired
            }
        });
    }, revealOptions);

    animatedElements.forEach(el => observer.observe(el));

    // --- Particle Generation ---
    const particlesContainer = document.getElementById('particles-container');
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.cssText = `
            position: absolute;
            width: ${Math.random() * 3}px;
            height: ${Math.random() * 3}px;
            background: ${i % 2 === 0 ? '#c9a84c' : '#fff'};
            border-radius: 50%;
            top: ${Math.random() * 100}vh;
            left: ${Math.random() * 100}vw;
            opacity: ${Math.random() * 0.5};
            pointer-events: none;
            z-index: 1;
        `;
        // Subtle floating animation
        gsap.to(p, {
            y: '-=100',
            x: `+=${Math.random() * 40 - 20}`,
            opacity: 0,
            duration: 5 + Math.random() * 10,
            repeat: -1,
            ease: 'none',
            delay: Math.random() * 5
        });
        particlesContainer.appendChild(p);
    }

    // --- Modern Feature Showcase Sticky & Parallax ---
    const showcaseSection = document.querySelector('.feature-showcase');
    const showcaseItems = gsap.utils.toArray('.showcase-item');
    
    if (showcaseSection && showcaseItems.length > 0) {
        gsap.registerPlugin(ScrollTrigger);

        // Individual item animations with parallax scrub
        showcaseItems.forEach((item, i) => {
            gsap.fromTo(item, 
                { 
                    y: 200, 
                    opacity: 0,
                    scale: 0.9
                },
                { 
                    y: 0, 
                    opacity: 1, 
                    scale: 1,
                    duration: 1.5, 
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: item,
                        start: "top 95%",
                        end: "top 30%",
                        scrub: 1
                    }
                }
            );
        });
    }

    // --- WhatsApp Float Visibility ---
    const waFloat = document.querySelector('.whatsapp-float');
    if (waFloat) {
        gsap.to(waFloat, {
            opacity: 1,
            visibility: 'visible',
            pointerEvents: 'auto',
            scrollTrigger: {
                trigger: '.hero-section',
                start: 'bottom 20%',
                toggleActions: 'play none none reverse'
            }
        });
    }

    // --- Mobile Menu Toggle ---
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenu = document.getElementById('close-menu');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const drawerLinks = document.querySelectorAll('.drawer-link');

    if (menuToggle && mobileDrawer) {
        menuToggle.addEventListener('click', () => {
            mobileDrawer.classList.toggle('active');
            menuToggle.classList.toggle('open');
        });
    }

    if (closeMenu && mobileDrawer) {
        closeMenu.addEventListener('click', () => {
            mobileDrawer.classList.remove('active');
            menuToggle.classList.remove('open');
        });
    }

    drawerLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileDrawer.classList.remove('active');
            menuToggle.classList.remove('open');
        });
    });
});

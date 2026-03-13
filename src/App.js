import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const App = () => {
  const canvasRef = useRef(null);
  const heroTitleRef = useRef(null);
  const marqueeRef = useRef(null);

  useEffect(() => {
    // Helper to load external scripts as the environment handles CDN links better
    const loadScript = (url) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const initApp = async () => {
      try {
        // Load dependencies from CDN
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js');
        await loadScript('https://unpkg.com/@studio-freight/lenis@1.0.34/dist/lenis.min.js');

        const gsap = window.gsap;
        const ScrollTrigger = window.ScrollTrigger;
        const Lenis = window.Lenis;

        gsap.registerPlugin(ScrollTrigger);

        // --- LENIS SMOOTH SCROLL ---
        const lenis = new Lenis();
        lenis.on('scroll', ScrollTrigger.update);
        
        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // --- THREE.JS SCENE ---
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        if (canvasRef.current) canvasRef.current.appendChild(renderer.domElement);

        const geometry = new THREE.PlaneGeometry(120, 120, 100, 100);
        const material = new THREE.MeshBasicMaterial({
          color: 0x00f2ff,
          wireframe: true,
          transparent: true,
          opacity: 0.1
        });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2.2;
        scene.add(plane);

        camera.position.set(0, 12, 40);

        let animationFrameId;
        const animate = () => {
          animationFrameId = requestAnimationFrame(animate);
          const time = Date.now() * 0.0004;
          const pos = plane.geometry.attributes.position.array;
          for (let i = 0; i < pos.length; i += 3) {
            pos[i + 2] = Math.sin(pos[i] * 0.1 + time) * 2 + Math.cos(pos[i + 1] * 0.1 + time) * 2;
          }
          plane.geometry.attributes.position.needsUpdate = true;
          renderer.render(scene, camera);
        };
        animate();

        // --- GSAP ANIMATIONS ---
        // Hero Entrance
        if (heroTitleRef.current) {
          const titleText = heroTitleRef.current.innerText;
          heroTitleRef.current.innerHTML = titleText.split('').map(char => `<span>${char}</span>`).join('');
        }

        const tl = gsap.timeline();
        tl.to('#hero-top', { opacity: 1, duration: 1 })
          .to('#hero-title span', { y: 0, stagger: 0.1, duration: 1.5, ease: "expo.out" }, "-=0.5")
          .from('#hero-sub', { opacity: 0, y: 10, duration: 1 }, "-=1")
          .from('#scroll-line', { scaleY: 0, duration: 1 }, "-=0.5");

        // Carousel Logic
        const words = document.querySelectorAll('.carousel-word');
        words.forEach(word => {
          const text = word.getAttribute('data-word');
          word.innerHTML = text.split('').map(char => `<span class="char">${char === ' ' ? '&nbsp;' : char}</span>`).join('');
        });

        const carouselTl = gsap.timeline({ repeat: -1 });
        words.forEach((word) => {
          const chars = word.querySelectorAll('.char');
          carouselTl
            .set(word, { opacity: 1 })
            .to(chars, {
              y: '0%',
              stagger: 0.05,
              duration: 0.8,
              ease: "expo.out"
            })
            .to(chars, {
              y: '-100%',
              stagger: 0.03,
              duration: 0.6,
              ease: "expo.in",
              delay: 1.5
            })
            .set(word, { opacity: 0 });
        });

        // Marquee
        if (marqueeRef.current) {
          gsap.to(marqueeRef.current, {
            xPercent: -30,
            ease: "none",
            scrollTrigger: {
              trigger: marqueeRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1
            }
          });
        }

        // Project Reveals
        gsap.utils.toArray('.project-item').forEach(item => {
          const overlay = item.querySelector('.reveal-overlay');
          ScrollTrigger.create({
            trigger: item,
            start: "top 80%",
            onEnter: () => {
              gsap.timeline()
                .to(overlay, { scaleX: 1, duration: 0.5, ease: "power2.inOut" })
                .set(overlay, { transformOrigin: "right" })
                .to(overlay, { scaleX: 0, duration: 0.5, ease: "power2.inOut" });
            }
          });
        });

        // Skills Parallax
        gsap.utils.toArray('.feature-card-alt').forEach((card) => {
          gsap.from(card, {
            x: 100,
            opacity: 0,
            duration: 1,
            scrollTrigger: {
              trigger: card,
              start: "top 90%",
              scrub: 1,
              end: "top 60%"
            }
          });
        });

        // 3D Camera Dive
        gsap.to(camera.position, {
          z: 10,
          y: 5,
          scrollTrigger: {
            trigger: "body",
            start: "top top",
            end: "bottom bottom",
            scrub: true
          }
        });

        // Resize Handler
        const handleResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup Closure
        window._cleanupApp = () => {
          window.removeEventListener('resize', handleResize);
          cancelAnimationFrame(animationFrameId);
          lenis.destroy();
          ScrollTrigger.getAll().forEach(t => t.kill());
        };

      } catch (err) {
        console.error("Failed to load scripts or initialize App", err);
      }
    };

    initApp();

    return () => {
      if (window._cleanupApp) window._cleanupApp();
    };
  }, []);

  return (
    <div className="bg-[#050505] text-white font-sans selection:bg-cyan-500 selection:text-black">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Inter:wght@300;400;600&display=swap');
        
        :root {
          --neon-blue: #00f2ff;
          --neon-pink: #ff007a;
        }

        .font-sync { font-family: 'Syncopate', sans-serif; }
        body { font-family: 'Inter', sans-serif; background-color: #050505; }

        #canvas-container canvas {
          position: fixed;
          top: 0;
          left: 0;
          z-index: -1;
          pointer-events: none;
        }

        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        #hero-title span {
          display: inline-block;
          transform: translateY(110%);
        }

        .neon-glow {
          text-shadow: 0 0 15px var(--neon-blue);
        }

        .reveal-box {
          position: relative;
          overflow: hidden;
        }
        
        .reveal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--neon-blue);
          transform: scaleX(0);
          transform-origin: left;
          z-index: 10;
        }

        .parallax-text {
          white-space: nowrap;
          font-size: 15vw;
          line-height: 1;
          opacity: 0.05;
          pointer-events: none;
        }

        .carousel-container {
          position: relative;
          height: 1.2em;
          display: inline-block;
          vertical-align: top;
          overflow: hidden;
        }
        
        .carousel-word {
          position: absolute;
          white-space: nowrap;
          left: 0;
          top: 0;
          opacity: 0;
        }

        .char {
          display: inline-block;
          transform: translateY(100%);
        }
      `}</style>

      <div id="canvas-container" ref={canvasRef}></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full p-6 md:p-10 flex justify-between items-center z-50">
        <div className="font-sync text-xl tracking-tighter neon-glow">ELLEN_DEV</div>
        <div className="hidden md:flex space-x-12 text-[10px] uppercase tracking-[0.3em] font-bold opacity-50">
          <a href="#work" className="hover:opacity-100 transition-opacity">Artifacts</a>
          <a href="#about" className="hover:opacity-100 transition-opacity">Philosophy</a>
          <a href="#contact" className="hover:opacity-100 transition-opacity">Contact</a>
        </div>
        <div className="text-[10px] uppercase tracking-widest opacity-50">Available for 2024</div>
      </nav>

      {/* Hero */}
      <section className="h-screen flex flex-col justify-center items-center relative overflow-hidden">
        <div className="text-center z-10 px-6">
          <div className="overflow-hidden mb-2">
            <span className="block text-[10px] tracking-[0.5em] uppercase opacity-0 font-sync" id="hero-top">Fullstack Creative</span>
          </div>
          <h1 className="font-sync text-6xl md:text-[9vw] leading-none mb-8 overflow-hidden" id="hero-title" ref={heroTitleRef}>
            ELLEN
          </h1>
          
          <div className="max-w-xl mx-auto font-sync text-xs md:text-sm tracking-widest uppercase flex justify-center items-center gap-3 h-6" id="hero-sub">
            <span className="opacity-40">18 &bull;</span>
            <div className="carousel-container min-w-[200px] text-left">
              <div className="carousel-word" data-word="STUDENT"></div>
              <div className="carousel-word" data-word="PROGRAMMER"></div>
              <div className="carousel-word" data-word="UI/UX DESIGNER"></div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-30">
          <span className="text-[10px] tracking-widest uppercase mb-2">Scroll</span>
          <div className="w-[1px] h-12 bg-white origin-top" id="scroll-line"></div>
        </div>
      </section>

      {/* Marquee Parallax */}
      <div className="py-20 overflow-hidden border-y border-white/5">
        <div className="parallax-text font-sync" id="marquee" ref={marqueeRef}>
          CODE SHOGUN • DIGITAL ARCHITECT • PIXEL RONIN • CODE SHOGUN • DIGITAL ARCHITECT • PIXEL RONIN •
        </div>
      </div>

      {/* Work Section */}
      <section id="work" className="px-[5vw] py-[10vh] min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20">
          <h2 className="font-sync text-4xl md:text-6xl uppercase">Selected<br/>Artifacts</h2>
          <p className="max-w-xs opacity-40 text-sm mt-4 md:mt-0 italic">01 — 03 / A collection of high-end builds</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
          <div className="project-item group cursor-pointer">
            <div className="reveal-box aspect-[16/10] mb-6">
              <div className="reveal-overlay"></div>
              <div className="w-full h-full glass-panel flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                <span className="font-sync opacity-20 group-hover:opacity-100 transition-opacity">01_SYNTH_CORE</span>
              </div>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-sync text-lg">SynthCore Systems</h4>
                <p className="text-xs opacity-40 uppercase tracking-widest mt-1">WebGL / React / GSAP</p>
              </div>
              <span className="text-xs border border-white/20 rounded-full px-3 py-1">2024</span>
            </div>
          </div>

          <div className="project-item group cursor-pointer pt-0 md:pt-40">
            <div className="reveal-box aspect-[10/12] mb-6">
              <div className="reveal-overlay"></div>
              <div className="w-full h-full glass-panel flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                <span className="font-sync opacity-20 group-hover:opacity-100 transition-opacity">02_NEO_JAPAN</span>
              </div>
            </div>
            <div>
              <h4 className="font-sync text-lg">Neo-Tokyo Interactive</h4>
              <p className="text-xs opacity-40 uppercase tracking-widest mt-1">Three.js / Shader Material</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="px-[5vw] py-[10vh] bg-white/5 backdrop-blur-3xl">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h3 className="font-sync text-3xl md:text-5xl leading-tight">THE BLADE OF<br/><span className="text-cyan-400">PRECISION.</span></h3>
            <p className="opacity-60 text-lg leading-relaxed">
              I believe that performance is a feature, and motion is a language.
              Every project is a duel against mediocrity.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-6 rounded-xl">
                <div className="text-cyan-400 font-sync text-xl mb-2">99%</div>
                <div className="text-[10px] uppercase tracking-widest opacity-50">Lighthouse Score</div>
              </div>
              <div className="glass-panel p-6 rounded-xl">
                <div className="text-pink-500 font-sync text-xl mb-2">60fps</div>
                <div className="text-[10px] uppercase tracking-widest opacity-50">Fluid Animation</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="feature-card-alt p-8 border-l-2 border-cyan-400 glass-panel">
              <h5 className="font-sync mb-2">Frontend Mastery</h5>
              <p className="text-xs opacity-40">React, Next.js, Vue, TypeScript</p>
            </div>
            <div className="feature-card-alt p-8 border-l-2 border-pink-500 glass-panel">
              <h5 className="font-sync mb-2">Creative Coding</h5>
              <p className="text-xs opacity-40">Three.js, GLSL, GSAP, Canvas API</p>
            </div>
            <div className="feature-card-alt p-8 border-l-2 border-white glass-panel">
              <h5 className="font-sync mb-2">Technical Strategy</h5>
              <p className="text-xs opacity-40">Architecture design, CI/CD, Performance Optimization</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="px-[5vw] py-[10vh] text-center border-t border-white/10">
        <div className="py-20">
          <span className="text-[10px] tracking-[0.5em] uppercase opacity-40 mb-6 block">Ready to collaborate?</span>
          <h2 className="font-sync text-4xl md:text-8xl hover:text-cyan-400 transition-colors cursor-pointer mb-10">HIRE_ELLEN</h2>
          <div className="flex justify-center space-x-8 text-[10px] tracking-widest uppercase opacity-50">
            {/* FIXED: Added proper href values instead of # */}
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100">LinkedIn</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100">GitHub</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-100">Twitter</a>
          </div>
        </div>
        <div className="mt-20 pt-10 border-t border-white/5 flex justify-between text-[8px] uppercase tracking-[0.3em] opacity-30">
          <span>© 2024 Ellen Studio</span>
          <span>Design for the new era</span>
        </div>
      </footer>
    </div>
  );
};

export default App;

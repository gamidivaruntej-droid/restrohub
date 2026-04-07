import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Landing = ({ onGetStarted }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [activeModal, setActiveModal] = useState(null);

    useEffect(() => {
        setIsVisible(true);

        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                } else {
                    entry.target.classList.remove('active');
                }
            });
        }, observerOptions);

        const revealElements = document.querySelectorAll('.reveal');
        revealElements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    const features = [
        { icon: '⚙️', title: 'Automatic Task Assignment', desc: 'Smart algorithms distribute tasks based on staff workload and expertise.' },
        { icon: '📍', title: 'Real-Time Tracking', desc: 'Monitor staff presence and task completion in live time.' },
        { icon: '📅', title: 'Shift Management', desc: 'Effortless scheduling with automated shift rotations and swaps.' },
        { icon: '💬', title: 'Community Chat', desc: 'Secure, real-time coordination hub for your entire workforce.' },
        { icon: '📈', title: 'Performance Monitoring', desc: 'Detailed analytics and insights into operational efficiency.' },
        { icon: '🛡️', title: 'Role-Based Access', desc: 'Secure permissions tailored to Managers, Chefs, and Staff.' },
    ];

    const steps = [
        { num: '01', title: 'Register', desc: 'Onboard your staff in minutes with easy role assignments.' },
        { num: '02', title: 'Automatic Assigns', desc: 'Our logic engine handles real-time task distribution.' },
        { num: '03', title: 'Operates', desc: 'Watch your service flow smoothly with zero-glare tracking.' }
    ];

    const Modal = ({ type, onClose }) => {
        if (!type) return null;

        const content = {
            about: {
                title: "About RestroHub",
                body: (
                    <div style={{ lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                            <strong>RestroHub</strong> is a premier automated restaurant workforce management system engineered for the demanding pace of modern culinary excellence.
                        </p>
                        <p style={{ marginBottom: '1.5rem' }}>
                            We bridge the gap between operational complexity and staff performance by leveraging advanced data orchestration and professional logic engines. Our platform ensures that every role—from the executive chef to the cleaning crew—is perfectly synchronized with the restaurant's real-time needs.
                        </p>
                        <div style={{ padding: '1.5rem', backgroundColor: 'var(--secondary-bg)', borderRadius: '16px', borderLeft: '4px solid var(--accent)' }}>
                            <h4 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>Our Mission</h4>
                            <p style={{ fontStyle: 'italic' }}>
                                "To empower restaurant teams through intelligent automation, transforming chaotic shifts into professional, synchronized service experiences."
                            </p>
                        </div>
                    </div>
                )
            },
            privacy: {
                title: "Privacy Policy",
                body: (
                    <div style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
                        <section style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>1. Introduction</h4>
                            <p>RestroHub ("the Platform") is an automated workforce management solution designed to optimize restaurant operations. By accessing or using our system, you acknowledge that you have read and agree to be bound by this Privacy Policy.</p>
                        </section>

                        <section style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>2. Information We Collect</h4>
                            <p><strong>Personal Information:</strong> We collect identifying details including your full name, professional email address, contact phone number, assigned role, and specific shift schedules.</p>
                            <p style={{ marginTop: '0.5rem' }}><strong>Work-Related Data:</strong> The system tracks operational metrics such as task assignments, attendance logs, performance throughput, and professional internal chat communications.</p>
                        </section>

                        <section style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>3. How We Use Information</h4>
                            <ul style={{ paddingLeft: '1.2rem' }}>
                                <li><strong>Task Management:</strong> Automating the distribution of responsibilities.</li>
                                <li><strong>Workforce Coordination:</strong> Ensuring optimal staff coverage across all stations.</li>
                                <li><strong>Security & Monitoring:</strong> Protecting system integrity and monitoring performance.</li>
                                <li><strong>Operational Efficiency:</strong> Analyzing data to further optimize restaurant workflows.</li>
                            </ul>
                        </section>

                        <section style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>4. Data Protection & Security</h4>
                            <p>We implement rigorous <strong>Role-Based Access Control (RBAC)</strong> to ensure staff only access information relevant to their domain. Sensitive data is stored via secure encryption, and multi-factor authentication mechanisms protect user identities.</p>
                        </section>

                        <section style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>5. Data Sharing & Transparency</h4>
                            <p>RestroHub maintains a strict <strong>No-Third-Party Sharing</strong> policy. Your professional data is never sold or shared with external advertisers. Data is utilized exclusively within the system for internal operational purposes.</p>
                        </section>

                        <section style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>6. User Responsibilities</h4>
                            <p>Users are responsible for maintaining the confidentiality of their login credentials. The platform must be used solely for professional purposes, and any misuse or unauthorized access is strictly prohibited.</p>
                        </section>

                        <section style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>7. Retention & Updates</h4>
                            <p>Professional data is retained as long as an account remains active. System administrators may remove data when it is no longer operationally necessary. This policy may be updated periodically to reflect evolving security practices.</p>
                        </section>

                        <section style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '2rem' }}>
                            <p>For support or privacy inquiries, contact: <span style={{ color: 'var(--accent)' }}>support@restrohub.io</span></p>
                            <p style={{ marginTop: '0.5rem', fontWeight: '700' }}>Thank you for driving excellence with RestroHub.</p>
                        </section>
                    </div>
                )
            }
        };

        const activeContent = content[type];

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 5000,
                padding: '2rem'
            }} onClick={onClose}>
                <div style={{
                    backgroundColor: 'var(--primary-bg)',
                    color: 'var(--text-main)',
                    maxWidth: '800px',
                    width: '100%',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    borderRadius: '28px',
                    padding: '3rem',
                    position: 'relative',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    border: '1px solid var(--border)'
                }} onClick={e => e.stopPropagation()}>
                    <button onClick={onClose} style={{
                        position: 'absolute',
                        top: '20px',
                        right: '25px',
                        background: 'none',
                        border: 'none',
                        fontSize: '2rem',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '10px'
                    }}>&times;</button>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '2rem', color: 'var(--accent)' }}>
                        {activeContent.title}
                    </h2>
                    {activeContent.body}
                </div>
            </div>
        );
    };

    return (
        <div className="landing-container" style={{
            backgroundColor: 'var(--primary-bg)',
            color: 'var(--text-main)',
            minHeight: '100vh',
            fontFamily: "'Inter', sans-serif",
            overflowX: 'hidden',
            transition: 'background-color 0.3s, color 0.3s'
        }}>
            {/* Hero Section */}
            <section className={`hero-section animate-hero ${isVisible ? 'active' : ''}`} style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '0 2rem',
                position: 'relative'
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
                    <div className="bg-bubbles" />
                </div>

                <div style={{ zIndex: 1 }}>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <h1 style={{ fontSize: '5rem', fontWeight: '900', marginBottom: '1rem', color: 'var(--accent)', letterSpacing: '-2px' }}>RESTRO HUB</h1>
                    </Link>
                    <h2 className="animate-title" style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Smart Workforce Management for Restaurants</h2>
                    <p className="animate-description" style={{ maxWidth: '700px', fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '3rem' }}>
                        Empower your team with automated task orchestration, real-time presence tracking, and seamless communication. Redefining modern restaurant operations for a professional workforce.
                    </p>
                    <div className="animate-fade" style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        <button className="btn-primary" onClick={onGetStarted} style={{ padding: '20px 40px', fontSize: '1.1rem', marginTop: 0, borderRadius: '16px' }}>GET STARTED</button>
                        <button className="btn-primary" onClick={onGetStarted} style={{
                            padding: '20px 40px',
                            fontSize: '1.1rem',
                            marginTop: 0,
                            borderRadius: '16px',
                            backgroundColor: 'transparent',
                            border: '2px solid var(--border)',
                            color: 'var(--text-main)'
                        }}>SIGN IN</button>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section style={{ 
                padding: window.innerWidth < 768 ? '4rem 1.5rem' : '8rem 2rem', 
                maxWidth: '1200px', 
                margin: '0 auto', 
                display: 'grid', 
                gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1fr 1fr', 
                gap: window.innerWidth < 1024 ? '40px' : '60px', 
                alignItems: 'center',
                textAlign: window.innerWidth < 1024 ? 'center' : 'left'
            }}>
                <div className="reveal">
                    <h2 style={{ fontSize: window.innerWidth < 768 ? '2rem' : '2.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>What is RestroHub?</h2>
                    <p style={{ fontSize: '1rem', lineHeight: '1.8', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        RestroHub is a next-generation workforce management platform designed specifically for the high-pressure environment of prestigious restaurants. We merge automated coordination with operational logic to ensure that every team member knows exactly what they should be doing, when, and where.
                    </p>
                    <ul style={{ 
                        listStyle: 'none', 
                        padding: 0, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '15px',
                        alignItems: window.innerWidth < 1024 ? 'center' : 'flex-start'
                    }}>
                        {['Zero-Glare Midnight Slate Interface', 'Secure Manager-Level Moderation', 'Dynamic Role-Locked Specialization'].map((li, idx) => (
                            <li key={li} className="reveal" style={{ transitionDelay: `${idx * 150}ms`, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: '600' }}>
                                <span style={{ color: 'var(--accent)' }}>✦</span> {li}
                            </li>
                        ))}
                    </ul>
                </div>
                <div style={{ position: 'relative', transitionDelay: '300ms' }} className="reveal">
                    <div style={{ position: 'relative', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div className="illustration-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
                            {/* Automatic Connection Lines */}
                            <svg style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 0 }}>
                                <line x1="30%" y1="30%" x2="70%" y2="70%" stroke="var(--accent)" strokeWidth="1" strokeDasharray="5,5" opacity="0.2">
                                    <animate attributeName="stroke-dashoffset" from="0" to="20" dur="2s" repeatCount="indefinite" />
                                </line>
                                <line x1="70%" y1="30%" x2="30%" y2="70%" stroke="var(--accent)" strokeWidth="1" strokeDasharray="5,5" opacity="0.2">
                                    <animate attributeName="stroke-dashoffset" from="20" to="0" dur="2s" repeatCount="indefinite" />
                                </line>
                                <circle cx="50%" cy="50%" r="4" fill="var(--accent)" className="pulse-node" />
                                <circle cx="30%" cy="30%" r="3" fill="var(--accent)" opacity="0.5" />
                                <circle cx="70%" cy="70%" r="3" fill="var(--accent)" opacity="0.5" />
                                <circle cx="70%" cy="30%" r="3" fill="var(--accent)" opacity="0.5" />
                                <circle cx="30%" cy="70%" r="3" fill="var(--accent)" opacity="0.5" />
                            </svg>

                            {/* Floating Tools */}
                            <div className="floating-tool" style={{ top: '20%', left: '25%', animationDelay: '0s' }}>🍴</div>
                            <div className="floating-tool" style={{ top: '15%', left: '60%', animationDelay: '1s' }}>🥄</div>
                            <div className="floating-tool" style={{ top: '65%', left: '30%', animationDelay: '2s' }}>🔪</div>
                            <div className="floating-tool" style={{ top: '60%', left: '65%', animationDelay: '0.5s' }}>🍳</div>

                            {/* Central Logic Hub */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '120px',
                                height: '120px',
                                background: 'radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, transparent 70%)',
                                borderRadius: '50%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                border: '1px solid rgba(249, 115, 22, 0.2)',
                                backdropFilter: 'blur(5px)',
                                zIndex: 1
                            }}>
                                <div style={{ fontSize: '2rem' }}>⚙️</div>
                            </div>
                        </div>

                        <div style={{
                            position: 'absolute',
                            top: '-20px',
                            right: '-20px',
                            width: '150px',
                            height: '150px',
                            background: 'var(--accent)',
                            borderRadius: '50%',
                            zIndex: -1,
                            filter: 'blur(60px)',
                            opacity: 0.2
                        }} />
                    </div>
                </div>
            </section>

            {/* Key Features */}
            <section style={{ padding: window.innerWidth < 768 ? '4rem 1.5rem' : '8rem 2rem', backgroundColor: 'var(--secondary-bg)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 className="reveal" style={{ fontSize: window.innerWidth < 768 ? '2rem' : '2.5rem', fontWeight: '800', marginBottom: '3rem' }}>Powerful Core Features</h2>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))', 
                        gap: '20px' 
                    }}>
                        {features.map((f, i) => (
                            <div key={i} className="feature-card reveal" style={{
                                padding: window.innerWidth < 768 ? '2rem' : '3rem',
                                backgroundColor: 'var(--primary-bg)',
                                borderRadius: '24px',
                                border: '1px solid var(--border)',
                                textAlign: 'left',
                                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                                transitionDelay: `${i * 100}ms`
                            }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{f.icon}</div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.5rem' }}>{f.title}</h3>
                                <p style={{ color: 'var(--text-muted)', lineHeight: '1.5', fontSize: '0.9rem' }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section style={{ padding: window.innerWidth < 768 ? '4rem 1.5rem' : '8rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }} className="reveal">
                    <h2 style={{ fontSize: window.innerWidth < 768 ? '2rem' : '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>How It Works</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Three simple steps to professional efficiency.</p>
                </div>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)', 
                    gap: '40px' 
                }}>
                    {steps.map((s, i) => (
                        <div key={i} className="reveal" style={{ textAlign: 'center', position: 'relative', transitionDelay: `${i * 200}ms` }}>
                            <div style={{
                                fontSize: '4rem',
                                fontWeight: '900',
                                color: 'rgba(255,255,255,0.03)',
                                marginBottom: '-2rem',
                                position: 'relative',
                                zIndex: 0
                            }}>{s.num}</div>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--accent)' }}>{s.title}</h3>
                                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>{s.desc}</p>
                            </div>
                            {i < 2 && window.innerWidth >= 768 && <div className="step-arrow" style={{ position: 'absolute', top: '50%', right: '-30px', transform: 'translateY(-50%)', fontSize: '1.5rem', opacity: 0.2 }}>→</div>}
                        </div>
                    ))}
                </div>
            </section>

            {/* Screenshots / CTA Preview */}
            <section style={{ padding: window.innerWidth < 768 ? '4rem 1.5rem' : '8rem 2rem', textAlign: 'center', background: 'linear-gradient(180deg, var(--secondary-bg) 0%, var(--primary-bg) 100%)' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }} className="reveal">
                    <h2 style={{ fontSize: window.innerWidth < 768 ? '2.2rem' : '3rem', fontWeight: '900', marginBottom: '2rem' }}>Transform Your Service Flow Today</h2>
                    <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '3rem' }}>Join elite restaurant teams leveraging RestroHub for professional staff performance.</p>
                    <button className="btn-primary" onClick={onGetStarted} style={{ padding: '20px 50px', fontSize: '1.1rem', marginTop: 0, borderRadius: '20px', boxShadow: '0 20px 40px rgba(249, 115, 22, 0.3)' }}>GET STARTED NOW 🚀</button>

                    <div style={{ marginTop: '4rem', position: 'relative', transitionDelay: '300ms' }} className="reveal">
                        <img src="/restrohub_hero_illustration_1772122036790.png" alt="" style={{ width: window.innerWidth < 768 ? '100%' : '80%', opacity: 0.8 }} />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '4rem 2rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--secondary-bg)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Link to="/" style={{ textDecoration: 'none' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--accent)', marginBottom: '0.5rem' }}>RESTRO HUB</div>
                        </Link>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>© 2026 RestroHub Inc. All rights reserved.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '40px', fontSize: '0.9rem', fontWeight: '600' }}>
                        <button onClick={() => setActiveModal('about')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>About</button>
                        <button onClick={() => setActiveModal('privacy')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>Privacy Policy</button>
                        <button onClick={() => alert('Support line: +1 (555) RESTRO-HUB')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>Contact</button>
                    </div>
                </div>
            </footer>

            <Modal type={activeModal} onClose={() => setActiveModal(null)} />

        </div>
    );
};

export default Landing;

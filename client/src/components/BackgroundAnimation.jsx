import React, { useEffect, useState } from 'react';

const BackgroundAnimation = () => {
    const [icons, setIcons] = useState([]);
    const toolIcons = ['🍴', '🥄', '🔪', '🍳', '🥣'];

    useEffect(() => {
        const newIcons = Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            char: toolIcons[Math.floor(Math.random() * toolIcons.length)],
            left: `${Math.random() * 100}%`,
            duration: `${10 + Math.random() * 15}s`,
            delay: `${Math.random() * 10}s`,
            fontSize: `${1.5 + Math.random() * 2}rem`
        }));
        setIcons(newIcons);
    }, []);

    return (
        <div className="animation-container">
            {icons.map((icon) => (
                <span
                    key={icon.id}
                    className="falling-icon"
                    style={{
                        left: icon.left,
                        animationDuration: icon.duration,
                        animationDelay: icon.delay,
                        fontSize: icon.fontSize
                    }}
                >
                    {icon.char}
                </span>
            ))}
        </div>
    );
};

export default BackgroundAnimation;

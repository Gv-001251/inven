import React from 'react';
import './CubeLoader.css';

const CubeLoader = () => {
    // Generate 16 cubes (4x4 grid)
    const cubes = Array(16).fill(null);

    return (
        <div className="cube-loader-wrapper">
            <div className="cube-grid">
                {cubes.map((_, index) => (
                    <div key={index} className="cube">
                        <div className="lifter">
                            <div className="cube__face cube__face--1"></div>
                            <div className="cube__face cube__face--2"></div>
                            <div className="cube__face cube__face--3"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CubeLoader;

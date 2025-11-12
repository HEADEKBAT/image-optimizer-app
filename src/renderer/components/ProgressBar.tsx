import React from 'react';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div style={{ width: '100%', backgroundColor: '#e0e0df', borderRadius: '5px' }}>
      <div
        style={{
          width: `${progress}%`,
          height: '20px',
          backgroundColor: '#3b5998',
          borderRadius: '5px',
          transition: 'width 0.5s ease-in-out',
        }}
      />
    </div>
  );
};

export default ProgressBar;
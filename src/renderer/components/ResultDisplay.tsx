import React from 'react';

interface ResultDisplayProps {
  convertedImages: string[];
  optimizationResults: { [key: string]: string };
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ convertedImages, optimizationResults }) => {
  return (
    <div className="result-display">
      <h2>Результаты конвертации и оптимизации</h2>
      <ul>
        {convertedImages.map((image, index) => (
          <li key={index}>
            <img src={image} alt={`Converted ${index}`} />
            <p>{optimizationResults[image]}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ResultDisplay;
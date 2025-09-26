import React from 'react';
import { useParams } from 'react-router-dom';

const OverlayView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="overlay-view">
      <h2>Overlay View</h2>
      <p>Overlay ID: {id}</p>
      {/* Add your overlay content here */}
    </div>
  );
};

export default OverlayView;

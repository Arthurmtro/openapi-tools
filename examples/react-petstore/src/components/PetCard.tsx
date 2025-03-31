import React from 'react';

// This type will be available after code generation
// For now, define a simplified version to avoid TypeScript errors
interface Pet {
  id?: number;
  name: string;
  status?: string;
  photoUrls: string[];
  category?: {
    id?: number;
    name?: string;
  };
}

interface PetCardProps {
  pet: Pet;
}

const PetCard: React.FC<PetCardProps> = ({ pet }) => {
  // Default image if no photos are available
  const defaultImage = 'https://placedog.net/300/200';

  return (
    <div className="pet-card">
      <div className="pet-image">
        <img 
          src={pet.photoUrls?.[0] || defaultImage} 
          alt={pet.name} 
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
      </div>
      <div className="pet-info">
        <h3>{pet.name}</h3>
        {pet.category && (
          <p>Category: {pet.category.name || 'Unknown'}</p>
        )}
        {pet.status && (
          <p className={`status status-${pet.status}`}>
            Status: {pet.status}
          </p>
        )}
        <p>ID: {pet.id || 'N/A'}</p>
      </div>
    </div>
  );
};

export default PetCard;
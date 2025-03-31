import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import api from '../api/client';
import PetCard from '../components/PetCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

type PetStatus = 'available' | 'pending' | 'sold';

const PetsPage: React.FC = () => {
  const [status, setStatus] = useState<PetStatus>('available');
  
  // Use our custom hook to fetch pets by status
  const { data: pets, isLoading, error, refetch } = useApi(
    () => {
      // This will work after code generation
      try {
        return api.pet.findPetsByStatus([status]);
      } catch (error) {
        console.error('API method not available yet:', error);
        // Return mock data for demonstration
        return Promise.resolve([
          { id: 1, name: 'Buddy', status: 'available', photoUrls: [] },
          { id: 2, name: 'Max', status: 'available', photoUrls: [] },
          { id: 3, name: 'Bella', status: 'available', photoUrls: [] },
        ]);
      }
    },
    [status]
  );

  const handleStatusChange = (newStatus: PetStatus) => {
    setStatus(newStatus);
  };

  return (
    <div className="pets-page">
      <h1>Petstore</h1>
      
      <div className="status-filter">
        <button 
          className={status === 'available' ? 'active' : ''} 
          onClick={() => handleStatusChange('available')}
        >
          Available
        </button>
        <button 
          className={status === 'pending' ? 'active' : ''} 
          onClick={() => handleStatusChange('pending')}
        >
          Pending
        </button>
        <button 
          className={status === 'sold' ? 'active' : ''} 
          onClick={() => handleStatusChange('sold')}
        >
          Sold
        </button>
      </div>
      
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage error={error} onRetry={refetch} />
      ) : (
        <div className="pets-grid">
          {pets && pets.length > 0 ? (
            pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))
          ) : (
            <p>No pets found with status: {status}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PetsPage;
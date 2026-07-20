export function expandLocations(countryOrBase: string, personaId?: string): string[] {
  const base = countryOrBase.toLowerCase().trim();

  // Basic expansions for India
  if (base === 'india' || base === 'in') {
    const locations = [
      'Remote',
      'Bangalore',
      'Bengaluru',
      'Delhi',
      'Delhi NCR',
      'Gurugram',
      'Noida',
      'Pune',
      'Hyderabad',
      'Mumbai',
      'Chennai',
      'Kolkata',
      'Ahmedabad',
      'Jaipur',
      'Chandigarh',
    ];

    // Optional: Persona-specific prioritization ordering
    if (personaId === 'AI_ML') {
      return [
        'Bangalore',
        'Remote',
        'Bengaluru',
        'Hyderabad',
        'Pune',
        'Gurugram',
        'Delhi NCR',
        'Noida',
      ];
    }
    if (personaId === 'RESEARCH') {
      return ['Bangalore', 'Delhi', 'Noida', 'Delhi NCR', 'Remote', 'Hyderabad', 'Pune'];
    }
    return locations;
  }

  // Fallback / direct return
  return [countryOrBase];
}

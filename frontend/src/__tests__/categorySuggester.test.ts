import { keywordMatcher } from '../utils/categorySuggester';

describe('CategorySuggester — Keyword Matcher', () => {
  const suggest = (desc: string) => keywordMatcher.suggest(desc);

  describe('Food & Dining', () => {
    it('matches "Starbucks coffee" → food & dining', () => {
      expect(suggest('Starbucks coffee')?.categoryName).toBe('food & dining');
    });
    it('matches "Lunch at Chipotle" → food & dining', () => {
      expect(suggest('Lunch at Chipotle')?.categoryName).toBe('food & dining');
    });
    it('matches "Swiggy order" → food & dining', () => {
      expect(suggest('Swiggy order')?.categoryName).toBe('food & dining');
    });
    it('matches uppercase "PIZZA delivery" case-insensitively → food & dining', () => {
      expect(suggest('PIZZA delivery')?.categoryName).toBe('food & dining');
    });
  });

  describe('Transportation', () => {
    it('matches "Uber ride home" → transportation', () => {
      expect(suggest('Uber ride home')?.categoryName).toBe('transportation');
    });
    it('matches "Fuel refill petrol pump" → transportation', () => {
      expect(suggest('Fuel refill petrol pump')?.categoryName).toBe('transportation');
    });
    it('matches "Lyft to airport" → transportation', () => {
      expect(suggest('Lyft to airport')?.categoryName).toBe('transportation');
    });
    it('matches "Monthly metro pass" → transportation', () => {
      expect(suggest('Monthly metro pass')?.categoryName).toBe('transportation');
    });
  });

  describe('Shopping', () => {
    it('matches "Amazon order" → shopping', () => {
      expect(suggest('Amazon order')?.categoryName).toBe('shopping');
    });
    it('matches "Zara clothing store" → shopping', () => {
      expect(suggest('Zara clothing store')?.categoryName).toBe('shopping');
    });
  });

  describe('Entertainment', () => {
    it('matches "Netflix subscription" → entertainment', () => {
      expect(suggest('Netflix subscription')?.categoryName).toBe('entertainment');
    });
    it('matches "Spotify Premium" → entertainment', () => {
      expect(suggest('Spotify Premium')?.categoryName).toBe('entertainment');
    });
    it('matches "Movie ticket BookMyShow" → entertainment', () => {
      expect(suggest('Movie ticket BookMyShow')?.categoryName).toBe('entertainment');
    });
  });

  describe('Health', () => {
    it('matches "Doctor visit clinic" → health', () => {
      expect(suggest('Doctor visit clinic')?.categoryName).toBe('health');
    });
    it('matches "Pharmacy medicine" → health', () => {
      expect(suggest('Pharmacy medicine')?.categoryName).toBe('health');
    });
    it('matches "Gym membership" → health', () => {
      expect(suggest('Gym membership')?.categoryName).toBe('health');
    });
  });

  describe('Utilities', () => {
    it('matches "Electricity bill payment" → utilities', () => {
      expect(suggest('Electricity bill payment')?.categoryName).toBe('utilities');
    });
    it('matches "Jio internet recharge" → utilities', () => {
      expect(suggest('Jio internet recharge')?.categoryName).toBe('utilities');
    });
  });

  describe('Education', () => {
    it('matches "Udemy React course" → education', () => {
      expect(suggest('Udemy React course')?.categoryName).toBe('education');
    });
    it('matches "Textbook purchase" → education', () => {
      expect(suggest('Textbook purchase')?.categoryName).toBe('education');
    });
  });

  describe('Travel', () => {
    it('matches "Airbnb stay vacation" → travel', () => {
      expect(suggest('Airbnb stay vacation')?.categoryName).toBe('travel');
    });
    it('matches "Hotel booking Paris" → travel', () => {
      expect(suggest('Hotel booking Paris')?.categoryName).toBe('travel');
    });
  });

  describe('No Match / Edge Cases', () => {
    it('returns null for an empty string', () => {
      expect(suggest('')).toBeNull();
    });
    it('returns null for a single character', () => {
      expect(suggest('a')).toBeNull();
    });
    it('returns null for a generic unrecognized description', () => {
      expect(suggest('miscellaneous payment xyz123')).toBeNull();
    });
    it('returns confidence 1.0 for a keyword match', () => {
      const result = suggest('Starbucks');
      expect(result?.confidence).toBe(1.0);
    });
  });
});

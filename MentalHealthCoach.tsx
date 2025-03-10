import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyB2CSaU-1T6i6EcJylA7u3Dkfd_flrsRKc');

interface MentalHealthCoachProps {
  className?: string;
}

const MentalHealthCoach: React.FC<MentalHealthCoachProps> = ({ className }) => {
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<string>('');
  const [height, setHeight] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [goal, setGoal] = useState<string>('');
  const [targetWeight, setTargetWeight] = useState<number | ''>('');
  const [timeframe, setTimeframe] = useState<string>('');
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const formatResponse = (text: string) => {
    let formattedText = text.replace(/^Okay, let's create.*\n\n/, '');
    
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, (match, p1) => {
      return `<strong>${p1}</strong>`;
    });
    
    formattedText = formattedText.replace(/(?<!\*)\.(\s*)/g, '.<br/><br/>')
      .replace(/<br\/>\*\s/g, '\n* ');
    
    return formattedText;
  };

  const handleGeneratePlan = async () => {
    if (!age || !gender || !height || !weight || !goal || !targetWeight || !timeframe) {
      alert('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const prompt = `
      Create a personalized 7-day meal plan for a ${age}-year-old ${gender} with a height of ${height} cm and weight of ${weight} kg, aiming to ${goal} and reach a target weight of ${targetWeight} kg within ${timeframe}.

Structure the plan as:

${Array.from({length: timeframe}, (_, i) => `- Month ${i + 1}:

Week 1: [Meal suggestions]

Week 2: [Meal suggestions]

Week 3: [Meal suggestions]

Week 4: [Meal suggestions]`).join('\n')}

Ensure the output is concise and tailored to the user's inputs.
      `;

      const result = await model.generateContent(prompt);
      const formattedPlan = formatResponse(result.response.text());
      setPlan(formattedPlan);
    } catch (error) {
      console.error('Error generating health plan:', error);
      alert('Failed to generate health plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${className} p-6`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary-600 mb-2">Health & Fitness Coach</h2>
        <p className="text-gray-600">
          Get a personalized health and fitness plan tailored to your goals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-4">
            <input
              type="number"
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer not to say">Prefer not to say</option>
            </select>
            <input
              type="number"
              placeholder="Height (cm)"
              value={height}
              onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : '')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="number"
              placeholder="Current Weight (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Your Goal</option>
              <option value="lose weight">Lose Weight</option>
              <option value="gain weight">Gain Weight</option>
              <option value="build muscle">Build Muscle</option>
              <option value="maintain weight">Maintain Weight</option>
              <option value="improve fitness">Improve Fitness</option>
            </select>
            <input
              type="number"
              placeholder="Target Weight (kg)"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value ? Number(e.target.value) : '')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Timeframe</option>
              <option value="1 month">1 Month</option>
              <option value="3 months">3 Months</option>
              <option value="6 months">6 Months</option>
              <option value="1 year">1 Year</option>
            </select>
            <button
              onClick={handleGeneratePlan}
              disabled={loading}
              className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Plan...
                </>
              ) : (
                'Generate Health Plan'
              )}
            </button>
          </div>
        </div>

        {plan && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-primary-600 mb-4">Your Personalized Health Plan</h3>
            <div 
              className="prose prose-blue max-w-none"
              dangerouslySetInnerHTML={{ __html: plan }} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MentalHealthCoach; 
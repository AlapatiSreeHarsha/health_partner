import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../api/config';

const genAI = new GoogleGenerativeAI(config.healthAIKey);

interface HealthFitnessCoachProps {
  className?: string;
}

interface NutritionPlan {
  dailyCalories: number;
  macros: {
    protein: string;
    carbs: string;
    fats: string;
  };
  mealPlan: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  };
}

const HealthFitnessCoach: React.FC<HealthFitnessCoachProps> = ({ className }) => {
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
    // Remove any potential JSON formatting artifacts
    let cleanText = text.replace(/```json|```/g, '').trim();
    
    try {
      // Try to parse as JSON first
      const jsonData = JSON.parse(cleanText);
      
      // Format the JSON data into HTML
      let formattedHtml = `
        <div class="space-y-6">
          <div class="bg-blue-50 p-4 rounded-lg">
            <h4 class="text-lg font-semibold text-blue-800 mb-2">Initial Assessment</h4>
            <p class="text-blue-700">${jsonData.assessment}</p>
            ${jsonData.bmi ? `<p class="mt-2 font-medium">BMI: ${jsonData.bmi}</p>` : ''}
          </div>

          <div class="bg-green-50 p-4 rounded-lg">
            <h4 class="text-lg font-semibold text-green-800 mb-2">Nutrition Plan</h4>
            <p class="font-medium text-green-700">Daily Calories: ${jsonData.nutrition.dailyCalories} kcal</p>
            <div class="mt-2">
              <p class="font-medium text-green-700">Macronutrients:</p>
              <ul class="list-disc list-inside mt-1 text-green-600">
                <li>Protein: ${jsonData.nutrition.macros.protein}</li>
                <li>Carbs: ${jsonData.nutrition.macros.carbs}</li>
                <li>Fats: ${jsonData.nutrition.macros.fats}</li>
              </ul>
            </div>
          </div>

          <div class="bg-purple-50 p-4 rounded-lg">
            <h4 class="text-lg font-semibold text-purple-800 mb-2">Exercise Plan</h4>
            ${jsonData.exercise.map((day: string) => `<p class="text-purple-600 mb-2">${day}</p>`).join('')}
          </div>

          <div class="bg-orange-50 p-4 rounded-lg">
            <h4 class="text-lg font-semibold text-orange-800 mb-2">Weekly Meal Plan</h4>
            <div class="space-y-4">
              ${Object.entries(jsonData.nutrition.mealPlan).map(([meal, items]) => `
                <div>
                  <h5 class="font-medium text-orange-700 capitalize">${meal}:</h5>
                  <ul class="list-disc list-inside mt-1 text-orange-600">
                    ${(items as string[]).map(item => `<li>${item}</li>`).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="bg-red-50 p-4 rounded-lg">
            <h4 class="text-lg font-semibold text-red-800 mb-2">Progress Tracking</h4>
            <ul class="list-disc list-inside text-red-600">
              ${jsonData.tracking.map((item: string) => `<li>${item}</li>`).join('')}
            </ul>
          </div>

          <div class="bg-indigo-50 p-4 rounded-lg">
            <h4 class="text-lg font-semibold text-indigo-800 mb-2">Additional Recommendations</h4>
            <ul class="list-disc list-inside text-indigo-600">
              ${jsonData.recommendations.map((item: string) => `<li>${item}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
      
      return formattedHtml;
    } catch (e) {
      // If JSON parsing fails, fall back to text formatting
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '<br/><br/>')
        .replace(/• (.*?)(?=(\n|$))/g, '<li>$1</li>')
        .replace(/(\d+\.) (.*?)(?=(\n|$))/g, '<li>$1 $2</li>')
        .replace(/<li>/g, '<li class="mb-2">')
        .replace(/(?<=<\/li>)\n/g, '');
    }
  };

  const handleGeneratePlan = async () => {
    if (!age || !gender || !height || !weight || !goal || !targetWeight || !timeframe) {
      alert('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const prompt = `As an expert fitness and nutrition coach, create a comprehensive health plan with the following details:

User Profile:
- Age: ${age} years
- Gender: ${gender}
- Height: ${height} cm
- Current Weight: ${weight} kg
- Target Weight: ${targetWeight} kg
- Goal: ${goal}
- Timeframe: ${timeframe}

Please provide a detailed plan in JSON format with the following structure:
{
  "assessment": "Initial assessment including calculated BMR and daily calorie needs",
  "bmi": "Calculated BMI with category",
  "nutrition": {
    "dailyCalories": number,
    "macros": {
      "protein": "amount in g with percentage",
      "carbs": "amount in g with percentage",
      "fats": "amount in g with percentage"
    },
    "mealPlan": {
      "breakfast": ["3-4 breakfast options"],
      "lunch": ["3-4 lunch options"],
      "dinner": ["3-4 dinner options"],
      "snacks": ["3-4 healthy snack options"]
    }
  },
  "exercise": [
    "Day 1: Detailed workout plan",
    "Day 2: Detailed workout plan",
    "Day 3: Detailed workout plan",
    "Day 4: Rest and recovery",
    "Day 5: Detailed workout plan",
    "Day 6: Detailed workout plan",
    "Day 7: Active recovery"
  ],
  "tracking": [
    "Weekly measurement points",
    "Progress photos schedule",
    "Weight tracking frequency",
    "Other metrics to track"
  ],
  "recommendations": [
    "Sleep recommendations",
    "Hydration goals",
    "Supplement suggestions if needed",
    "Lifestyle adjustments",
    "Recovery techniques"
  ]
}

Ensure all calculations are accurate and the plan is realistic for the user's goals and timeframe.
Include specific exercises with sets and reps in the exercise plan.
Provide detailed meal options with portion sizes in the meal plan.
All recommendations should be evidence-based and safe.`;

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
              <option value="1">1 Month</option>
              <option value="3">3 Months</option>
              <option value="6">6 Months</option>
              <option value="12">1 Year</option>
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
          <div className="bg-white rounded-lg shadow-lg p-6 overflow-y-auto max-h-[800px]">
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

export default HealthFitnessCoach; 
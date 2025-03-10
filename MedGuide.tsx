import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyB2CSaU-1T6i6EcJylA7u3Dkfd_flrsRKc');

interface MedGuideProps {
  className?: string;
}

const MedGuide: React.FC<MedGuideProps> = ({ className }) => {
  const [symptoms, setSymptoms] = useState<string>('');
  const [analysis, setAnalysis] = useState<{
    diseaseInfo: string | null;
    drugInteractions: string | null;
    recommendations: string | null;
  }>({
    diseaseInfo: null,
    drugInteractions: null,
    recommendations: null
  });
  const [loading, setLoading] = useState<boolean>(false);

  const formatResponse = (text: string) => {
    let formattedText = text.replace(/^Okay, let's break down.*\n\n/, '');
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, (match, p1) => {
      return `<strong>${p1}</strong>`;
    });
    formattedText = formattedText.replace(/(?<!\*)\.(\s*)/g, '.<br/>')
      .replace(/<br\/>\*\s/g, '\n* ');
    return formattedText;
  };

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) {
      alert('Please describe your symptoms first.');
      return;
    }

    try {
      setLoading(true);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const diseasePrompt = `
        Based on the symptoms: "${symptoms}", provide a brief medical analysis in the following format:

        Potential Conditions:
        • List 3-4 most likely conditions
        • Keep each point to 1-2 sentences
        
        Key Symptoms to Watch:
        • List 4-5 key symptoms
        • Include severity indicators
        
        Risk Factors:
        • List 3-4 main risk factors
        
        Note: Keep responses concise and bullet-pointed. No long paragraphs.
      `;

      const drugInteractionsPrompt = `
        For the symptoms: "${symptoms}", provide brief medication guidance in the following format:

        Common Treatments:
        • List 3-4 main medication types
        • One line description each
        
        Key Precautions:
        • List 3-4 important warnings
        • Include drug interactions
        
        Safety Notes:
        • List 2-3 key safety points
        
        Note: Keep each point brief and clear. Use bullet points only.
      `;

      const recommendationsPrompt = `
        For managing symptoms: "${symptoms}", provide concise recommendations in the following format:

        Immediate Actions:
        • List 3-4 immediate steps
        • Keep each point actionable
        
        Lifestyle Changes:
        • List 3-4 key modifications
        • One line each
        
        When to Seek Help:
        • List 2-3 warning signs
        • Be specific and clear
        
        Note: Use bullet points only. Keep each point short and actionable.
      `;

      const diseaseResult = await model.generateContent(diseasePrompt);
      const diseaseInfo = formatResponse(diseaseResult.response.text());

      const drugInteractionsResult = await model.generateContent(drugInteractionsPrompt);
      const drugInteractions = formatResponse(drugInteractionsResult.response.text());

      const recommendationsResult = await model.generateContent(recommendationsPrompt);
      const recommendations = formatResponse(recommendationsResult.response.text());

      setAnalysis({
        diseaseInfo,
        drugInteractions,
        recommendations
      });

    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      alert('Failed to analyze symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${className} p-6`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary-600 mb-2">MedGuide</h2>
        <p className="text-gray-600">
          Your medical information assistant. Get reliable health information and guidance on medical topics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe your symptoms in detail..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none min-h-[200px] text-lg"
              rows={8}
            />
          </div>

          <button
            onClick={analyzeSymptoms}
            disabled={loading}
            className="w-full px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : (
              'Analyze Symptoms'
            )}
          </button>
        </div>

        <div className="h-[calc(100vh-300px)] overflow-y-auto pr-4 space-y-6 custom-scrollbar">
          {!analysis.diseaseInfo && !analysis.drugInteractions && !analysis.recommendations && (
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center p-6">
                <p className="text-gray-500">Enter your symptoms and click "Analyze Symptoms" to get medical guidance</p>
              </div>
            </div>
          )}
          
          {analysis.diseaseInfo && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-xl shadow-sm border border-red-200">
              <h4 className="text-xl font-bold text-red-800 mb-3 sticky top-0 bg-gradient-to-r from-red-50 to-red-100 py-2">Disease Information</h4>
              <div 
                className="prose prose-red max-w-none text-red-700"
                dangerouslySetInnerHTML={{ __html: analysis.diseaseInfo }}
              />
            </div>
          )}

          {analysis.drugInteractions && (
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-sm border border-yellow-200">
              <h4 className="text-xl font-bold text-yellow-800 mb-3 sticky top-0 bg-gradient-to-r from-yellow-50 to-yellow-100 py-2">Drug Interactions</h4>
              <div 
                className="prose prose-yellow max-w-none text-yellow-700"
                dangerouslySetInnerHTML={{ __html: analysis.drugInteractions }}
              />
            </div>
          )}

          {analysis.recommendations && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
              <h4 className="text-xl font-bold text-green-800 mb-3 sticky top-0 bg-gradient-to-r from-green-50 to-green-100 py-2">Health Recommendations</h4>
              <div 
                className="prose prose-green max-w-none text-green-700"
                dangerouslySetInnerHTML={{ __html: analysis.recommendations }}
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #666;
        }
      `}</style>
    </div>
  );
};

export default MedGuide; 
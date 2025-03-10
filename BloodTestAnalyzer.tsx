import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FileText } from 'lucide-react';
import { config } from '../api/config';

const genAI = new GoogleGenerativeAI(config.bloodTestApiKey);

interface BloodTestAnalyzerProps {
  className?: string;
}

interface AnalysisResult {
  abnormalValues: {
    high: string[];
    low: string[];
  };
  possibleConditions: string[];
  dietaryRecommendations: string[];
  medicationSuggestions: string[];
  lifestyleChanges: string[];
}

const BloodTestAnalyzer: React.FC<BloodTestAnalyzerProps> = ({ className }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please upload a PDF file');
    }
  };

  const analyzeReport = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      // Convert PDF to base64
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
      });

      const prompt = `You are a medical expert analyzing a blood test report. Please analyze this report and provide a detailed assessment in the following JSON format:

{
  "abnormalValues": {
    "high": ["list of parameters that are higher than normal"],
    "low": ["list of parameters that are lower than normal"]
  },
  "possibleConditions": ["list of potential medical conditions based on abnormal values"],
  "dietaryRecommendations": ["specific food items and nutrients to address deficiencies"],
  "medicationSuggestions": ["types of supplements or medications that might help"],
  "lifestyleChanges": ["recommended lifestyle modifications"]
}

Please be specific and thorough in your analysis. Include normal range references where relevant.`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "application/pdf",
            data: fileData.split(',')[1]
          }
        }
      ]);

      const responseText = result.response.text().trim();
      const cleanJson = responseText.replace(/^```json\s*|\s*```$/g, '').trim();
      const analysisResult = JSON.parse(cleanJson);
      
      setAnalysis(analysisResult);
    } catch (error) {
      console.error('Error analyzing blood test report:', error);
      alert('Failed to analyze the report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${className} p-6`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary-600 mb-2">Blood Test Analyzer</h2>
        <p className="text-gray-600">
          Upload your blood test report (PDF) for a comprehensive analysis and personalized recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileText className="w-12 h-12 mb-4 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">PDF files only</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="application/pdf"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {selectedFile && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">Selected file: {selectedFile.name}</p>
              <button
                onClick={analyzeReport}
                disabled={loading}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Report...
                  </>
                ) : (
                  'Analyze Report'
                )}
              </button>
            </div>
          )}
        </div>

        {analysis && (
          <div className="h-[calc(100vh-300px)] overflow-y-auto pr-4 space-y-6 custom-scrollbar">
            {(analysis.abnormalValues.high.length > 0 || analysis.abnormalValues.low.length > 0) && (
              <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                <h3 className="text-lg font-semibold text-red-800 mb-3">Abnormal Values</h3>
                {analysis.abnormalValues.high.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-md font-medium text-red-700">Elevated Levels:</h4>
                    <ul className="list-disc list-inside text-red-600">
                      {analysis.abnormalValues.high.map((item, index) => (
                        <li key={`high-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.abnormalValues.low.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-red-700">Low Levels:</h4>
                    <ul className="list-disc list-inside text-red-600">
                      {analysis.abnormalValues.low.map((item, index) => (
                        <li key={`low-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {analysis.possibleConditions.length > 0 && (
              <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">Possible Conditions</h3>
                <ul className="list-disc list-inside text-yellow-700">
                  {analysis.possibleConditions.map((condition, index) => (
                    <li key={`condition-${index}`}>{condition}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.dietaryRecommendations.length > 0 && (
              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Dietary Recommendations</h3>
                <ul className="list-disc list-inside text-green-700">
                  {analysis.dietaryRecommendations.map((recommendation, index) => (
                    <li key={`diet-${index}`}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.medicationSuggestions.length > 0 && (
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Medication Suggestions</h3>
                <ul className="list-disc list-inside text-blue-700">
                  {analysis.medicationSuggestions.map((medication, index) => (
                    <li key={`med-${index}`}>{medication}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.lifestyleChanges.length > 0 && (
              <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">Lifestyle Changes</h3>
                <ul className="list-disc list-inside text-purple-700">
                  {analysis.lifestyleChanges.map((change, index) => (
                    <li key={`lifestyle-${index}`}>{change}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
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

export default BloodTestAnalyzer; 
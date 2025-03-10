import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_BASE_URL } from '../api/config';

const genAI = new GoogleGenerativeAI('AIzaSyB2CSaU-1T6i6EcJylA7u3Dkfd_flrsRKc');

interface SkinAnalysis {
  status: 'healthy' | 'concern' | 'error';
  confidence: number;
  condition: string;
  description: string;
  recommendations: string[];
  products?: string[];
}

interface SkinHealthMonitorProps {
  className?: string;
}

const SkinHealthMonitor: React.FC<SkinHealthMonitorProps> = ({ className }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    skinCondition: '',
    symptoms: '',
    notes: '',
    imageUrl: ''
  });
  const [message, setMessage] = useState('');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    try {
      setLoading(true);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      const imageData = selectedImage.split(',')[1];
      
      const prompt = `You are a skin analysis AI. Analyze the provided skin image and give a detailed assessment.
      Consider:
      1. Overall skin health
      2. Presence of any issues (acne, rashes, dryness, etc.)
      3. Specific areas of concern
      4. Confidence level in assessment

      Respond with ONLY a valid JSON object in this exact format (no markdown, no backticks):
      {
        "status": "healthy" or "concern",
        "confidence": number between 0-100,
        "condition": "brief description of main condition",
        "description": "detailed analysis",
        "recommendations": ["list of skincare recommendations"],
        "products": ["suggested product types or ingredients"]
      }

      If skin appears healthy, include preventive care and maintenance recommendations.
      If concerns detected, provide specific treatment suggestions and product types.`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageData
          }
        }
      ]);

      const responseText = result.response.text().trim();
      // Remove any potential markdown formatting or backticks
      const cleanJson = responseText.replace(/^```json\s*|\s*```$/g, '').trim();
      const response = JSON.parse(cleanJson);
      
      // Validate the response structure
      if (!response.status || !response.confidence || !response.description || !response.recommendations) {
        throw new Error('Invalid response format');
      }
      
      setAnalysis(response);
      
    } catch (error) {
      console.error('Error analyzing skin image:', error);
      setAnalysis({
        status: 'error',
        confidence: 0,
        condition: 'Error',
        description: 'Failed to analyze image. Please try again.',
        recommendations: ['Please try uploading a different image or try again later.']
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/health-monitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          symptoms: formData.symptoms.split(',').map(s => s.trim())
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }

      const data = await response.json();
      setMessage('Data saved successfully!');
      setFormData({
        skinCondition: '',
        symptoms: '',
        notes: '',
        imageUrl: ''
      });
    } catch (error) {
      setMessage('Error saving data. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className={`${className} p-6`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary-600 mb-2">Skin Health Monitor</h2>
        <p className="text-gray-600">
          Upload a clear image of your skin to receive personalized analysis and recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 800x400px)</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          </div>

          {selectedImage && (
            <div className="text-center">
              <img
                src={selectedImage}
                alt="Selected skin"
                className="max-w-full h-auto rounded-lg mx-auto mb-4"
                style={{ maxHeight: '300px' }}
              />
              <button
                onClick={analyzeImage}
                disabled={loading}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  'Analyze Skin'
                )}
              </button>
            </div>
          )}
        </div>

        {analysis && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className={`text-lg font-semibold mb-4 ${
              analysis.status === 'healthy' ? 'text-green-600' : 
              analysis.status === 'concern' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {analysis.status === 'healthy' ? 'Healthy Skin' : 
               analysis.status === 'concern' ? 'Areas of Concern Detected' : 'Analysis Error'}
              {analysis.confidence && (
                <span className="text-sm text-gray-500 ml-2">
                  ({analysis.confidence}% confidence)
                </span>
              )}
            </div>

            {analysis.condition && (
              <div className="mb-4">
                <h3 className="text-md font-semibold text-gray-700">Condition:</h3>
                <p className="text-gray-600">{analysis.condition}</p>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-md font-semibold text-gray-700">Analysis:</h3>
              <p className="text-gray-600">{analysis.description}</p>
            </div>

            {analysis.recommendations && (
              <div className="mb-4">
                <h3 className="text-md font-semibold text-gray-700">Recommendations:</h3>
                <ul className="list-disc list-inside text-gray-600">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="mb-1">{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.products && (
              <div>
                <h3 className="text-md font-semibold text-gray-700">Suggested Products:</h3>
                <ul className="list-disc list-inside text-gray-600">
                  {analysis.products.map((product, index) => (
                    <li key={index} className="mb-1">{product}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Skin Condition
          </label>
          <input
            type="text"
            name="skinCondition"
            value={formData.skinCondition}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Symptoms (comma-separated)
          </label>
          <input
            type="text"
            name="symptoms"
            value={formData.symptoms}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Image URL (optional)
          </label>
          <input
            type="url"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {message && (
          <div className={`p-4 rounded-md ${
            message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Saving...' : 'Save Data'}
        </button>
      </form>
    </div>
  );
};

export default SkinHealthMonitor; 
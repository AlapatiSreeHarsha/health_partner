import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../api/config';

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(config.healthAIKey);

interface HealthLegalAgentProps {
  className?: string;
}

const HealthLegalAgent: React.FC<HealthLegalAgentProps> = ({ className }) => {
  const [query, setQuery] = useState<string>('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const formatResponse = (text: string) => {
    // Remove any potential JSON formatting artifacts
    let cleanText = text.replace(/```json|```/g, '').trim();
    
    try {
      // Try to parse as JSON first
      const jsonData = JSON.parse(cleanText);
      
      // Format the JSON data into HTML
      let formattedHtml = `
        <div class="space-y-8">
          <div class="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200">
            <h4 class="text-xl font-bold text-blue-800 mb-3 flex items-center">
              <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Summary
            </h4>
            <p class="text-blue-700 text-lg leading-relaxed">${jsonData.summary}</p>
          </div>

          <div class="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
            <h4 class="text-xl font-bold text-green-800 mb-3 flex items-center">
              <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              Legal Rights
            </h4>
            <ul class="space-y-3">
              ${jsonData.rights.map((right: string) => `
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-green-600 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span class="text-green-700">${right}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <div class="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border border-purple-200">
            <h4 class="text-xl font-bold text-purple-800 mb-3 flex items-center">
              <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
              </svg>
              Applicable Laws
            </h4>
            <ul class="space-y-3">
              ${jsonData.laws.map((law: string) => `
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-purple-600 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                  </svg>
                  <span class="text-purple-700">${law}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <div class="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-xl shadow-sm border border-orange-200">
            <h4 class="text-xl font-bold text-orange-800 mb-3 flex items-center">
              <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
              Recommended Actions
            </h4>
            <ol class="space-y-3">
              ${jsonData.actions.map((action: string, index: number) => `
                <li class="flex items-start">
                  <span class="flex-shrink-0 w-6 h-6 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center mr-2 mt-1 font-semibold text-sm">${index + 1}</span>
                  <span class="text-orange-700">${action}</span>
                </li>
              `).join('')}
            </ol>
          </div>

          <div class="bg-gradient-to-r from-indigo-50 to-indigo-100 p-6 rounded-xl shadow-sm border border-indigo-200">
            <h4 class="text-xl font-bold text-indigo-800 mb-3 flex items-center">
              <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              Additional Resources
            </h4>
            <ul class="space-y-3">
              ${jsonData.resources.map((resource: string) => `
                <li class="flex items-start">
                  <svg class="w-5 h-5 text-indigo-600 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                  <span class="text-indigo-700">${resource}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <div class="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-xl shadow-sm border border-red-200">
            <h4 class="text-xl font-bold text-red-800 mb-3 flex items-center">
              <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              Important Disclaimer
            </h4>
            <p class="text-red-700 text-lg leading-relaxed italic">${jsonData.disclaimer}</p>
          </div>
        </div>
      `;
      
      return formattedHtml;
    } catch (e) {
      // If JSON parsing fails, fall back to text formatting
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary-700">$1</strong>')
        .replace(/\n\n/g, '</p><p class="mb-4">')
        .replace(/• (.*?)(?=(\n|$))/g, '<li class="text-gray-700 mb-2">$1</li>')
        .replace(/(\d+\.) (.*?)(?=(\n|$))/g, '<li class="text-gray-700 mb-2">$1 $2</li>')
        .replace(/<li>/g, '<li class="mb-2">')
        .replace(/(?<=<\/li>)\n/g, '')
        .replace(/^/, '<p class="mb-4">')
        .replace(/$/, '</p>');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      alert('Please enter your health legal question.');
      return;
    }

    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const prompt = `As an expert healthcare legal advisor, provide comprehensive guidance on the following health-related legal query:

"${query}"

Please structure your response in JSON format as follows:
{
  "summary": "A brief overview of the situation and key points",
  "rights": [
    "List each right as a plain string",
    "Each right should be clearly explained as text"
  ],
  "laws": [
    "List each law as a plain string",
    "Include specific statutes or codes as text"
  ],
  "actions": [
    "List each action as a plain string",
    "Practical steps as text"
  ],
  "resources": [
    "List each resource as a plain string",
    "Include contact information as text"
  ],
  "disclaimer": "A clear legal disclaimer about the nature of this advice"
}

Ensure each array contains plain text strings, not objects.
Make the response:
1. Accurate and up-to-date with current healthcare laws
2. Clear and understandable for non-legal professionals
3. Practical and actionable
4. Properly cited where relevant
5. Include appropriate disclaimers

Note: Ensure all array items are plain strings, not objects.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      // Remove any potential JSON formatting artifacts
      let cleanText = responseText.replace(/```json|```/g, '').trim();
      
      try {
        // Try to parse as JSON first
        const jsonData = JSON.parse(cleanText);
        
        // Format the JSON data into HTML
        let formattedHtml = `
          <div class="space-y-8">
            <div class="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200">
              <h4 class="text-xl font-bold text-blue-800 mb-3 flex items-center">
                <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Summary
              </h4>
              <p class="text-blue-700 text-lg leading-relaxed">${jsonData.summary}</p>
            </div>

            <div class="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
              <h4 class="text-xl font-bold text-green-800 mb-3 flex items-center">
                <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                Legal Rights
              </h4>
              <ul class="space-y-3">
                ${jsonData.rights.map((right: string) => `
                  <li class="flex items-start">
                    <svg class="w-5 h-5 text-green-600 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="text-green-700">${right}</span>
                  </li>
                `).join('')}
              </ul>
            </div>

            <div class="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border border-purple-200">
              <h4 class="text-xl font-bold text-purple-800 mb-3 flex items-center">
                <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                </svg>
                Applicable Laws
              </h4>
              <ul class="space-y-3">
                ${jsonData.laws.map((law: string) => `
                  <li class="flex items-start">
                    <svg class="w-5 h-5 text-purple-600 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                    </svg>
                    <span class="text-purple-700">${law}</span>
                  </li>
                `).join('')}
              </ul>
            </div>

            <div class="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-xl shadow-sm border border-orange-200">
              <h4 class="text-xl font-bold text-orange-800 mb-3 flex items-center">
                <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                </svg>
                Recommended Actions
              </h4>
              <ol class="space-y-3">
                ${jsonData.actions.map((action: string, index: number) => `
                  <li class="flex items-start">
                    <span class="flex-shrink-0 w-6 h-6 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center mr-2 mt-1 font-semibold text-sm">${index + 1}</span>
                    <span class="text-orange-700">${action}</span>
                  </li>
                `).join('')}
              </ol>
            </div>

            <div class="bg-gradient-to-r from-indigo-50 to-indigo-100 p-6 rounded-xl shadow-sm border border-indigo-200">
              <h4 class="text-xl font-bold text-indigo-800 mb-3 flex items-center">
                <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Additional Resources
              </h4>
              <ul class="space-y-3">
                ${jsonData.resources.map((resource: string) => `
                  <li class="flex items-start">
                    <svg class="w-5 h-5 text-indigo-600 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                    <span class="text-indigo-700">${resource}</span>
                  </li>
                `).join('')}
              </ul>
            </div>

            <div class="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-xl shadow-sm border border-red-200">
              <h4 class="text-xl font-bold text-red-800 mb-3 flex items-center">
                <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                Important Disclaimer
              </h4>
              <p class="text-red-700 text-lg leading-relaxed italic">${jsonData.disclaimer}</p>
            </div>
          </div>
        `;
        
        setResponse(formattedHtml);
      } catch (e) {
        // If JSON parsing fails, fall back to text formatting
        const fallbackHtml = responseText
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n\n/g, '</p><p class="mb-4">')
          .replace(/• (.*?)(?=(\n|$))/g, '<li class="text-gray-700 mb-2">$1</li>')
          .replace(/(\d+\.) (.*?)(?=(\n|$))/g, '<li class="text-gray-700 mb-2">$1 $2</li>')
          .replace(/<li>/g, '<li class="mb-2">')
          .replace(/(?<=<\/li>)\n/g, '')
          .replace(/^/, '<p class="mb-4">')
          .replace(/$/, '</p>');
        setResponse(fallbackHtml);
      }
    } catch (error) {
      console.error('Error generating health legal guidance:', error);
      alert('Failed to generate legal guidance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${className} p-6 max-w-[1920px] mx-auto`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary-600 mb-2">Health Legal Assistant</h2>
        <p className="text-gray-600">
          Get expert guidance on healthcare legal matters, patient rights, and medical regulations.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        <div className="space-y-4 xl:max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your health legal question..."
                className="w-full p-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none min-h-[400px] text-lg"
                rows={12}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Get Legal Guidance'
              )}
            </button>
          </form>
        </div>

        <div className="h-full xl:max-w-4xl">
          {response ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">Legal Guidance</h3>
              </div>
              <div className="p-6 prose prose-blue max-w-none overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                <div dangerouslySetInnerHTML={{ __html: response }} />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center p-8">
                <h3 className="text-xl font-medium text-gray-900">No Response Yet</h3>
                <p className="mt-2 text-base text-gray-500">
                  Enter your health legal question on the left and click "Get Legal Guidance" to receive expert advice.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthLegalAgent; 
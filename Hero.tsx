import React from 'react';
import { Heart, Brain, Scale, Calendar, Activity, Droplet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-primary-50 to-white">
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row items-start gap-12">
          <div className="lg:w-1/3 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight">
              Your AI Health Partner
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              Personalized wellness plans, legal insights, and instant appointment booking powered by advanced AI.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/medguide')}
                className="bg-primary-500 text-white px-8 py-3 rounded-full hover:bg-primary-600 transition-colors text-lg"
              >
                Ask Your Health Query
              </button>
              <button 
                onClick={() => navigate('/appointments')}
                className="border-2 border-primary-500 text-primary-500 px-8 py-3 rounded-full hover:bg-primary-50 transition-colors text-lg"
              >
                Book an Appointment
              </button>
            </div>
          </div>
        
          <div className="lg:w-2/3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div 
                className="animate-float delay-0 cursor-pointer transform transition-transform hover:scale-105"
                onClick={() => navigate('/medguide')}
              >
                <div className="bg-white p-6 rounded-2xl shadow-lg h-full">
                  <Activity className="h-12 w-12 text-primary-500 mb-4" />
                  <h3 className="text-lg font-semibold">Medical Guide</h3>
                  <p className="text-gray-600 mt-2">Symptom analysis & guidance</p>
                </div>
              </div>

              <div 
                className="animate-float delay-100 cursor-pointer transform transition-transform hover:scale-105"
                onClick={() => navigate('/appointments')}
              >
                <div className="bg-white p-6 rounded-2xl shadow-lg h-full">
                  <Calendar className="h-12 w-12 text-primary-500 mb-4" />
                  <h3 className="text-lg font-semibold">Smart Scheduling</h3>
                  <p className="text-gray-600 mt-2">AI-optimized appointments</p>
                </div>
              </div>

              <div 
                className="animate-float delay-200 cursor-pointer transform transition-transform hover:scale-105"
                onClick={() => navigate('/fitness')}
              >
                <div className="bg-white p-6 rounded-2xl shadow-lg h-full">
                  <Activity className="h-12 w-12 text-primary-500 mb-4" />
                  <h3 className="text-lg font-semibold">Health & Fitness</h3>
                  <p className="text-gray-600 mt-2">Personalized fitness plans</p>
                </div>
              </div>

              <div 
                className="animate-float delay-300 cursor-pointer transform transition-transform hover:scale-105"
                onClick={() => navigate('/health')}
              >
                <div className="bg-white p-6 rounded-2xl shadow-lg h-full">
                  <Heart className="h-12 w-12 text-primary-500 mb-4" />
                  <h3 className="text-lg font-semibold">Skin Health Monitor</h3>
                  <p className="text-gray-600 mt-2">24/7 AI-powered health tracking</p>
                </div>
              </div>

              <div 
                className="animate-float delay-400 cursor-pointer transform transition-transform hover:scale-105"
                onClick={() => navigate('/blood-test')}
              >
                <div className="bg-white p-6 rounded-2xl shadow-lg h-full">
                  <Droplet className="h-12 w-12 text-primary-500 mb-4" />
                  <h3 className="text-lg font-semibold">Blood Test Analyzer</h3>
                  <p className="text-gray-600 mt-2">Analyze blood reports & get insights</p>
                </div>
              </div>

              <div 
                className="animate-float delay-500 cursor-pointer transform transition-transform hover:scale-105"
                onClick={() => navigate('/legal-agent')}
              >
                <div className="bg-white p-6 rounded-2xl shadow-lg h-full">
                  <Scale className="h-12 w-12 text-primary-500 mb-4" />
                  <h3 className="text-lg font-semibold">Legal Support</h3>
                  <p className="text-gray-600 mt-2">Healthcare rights guidance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
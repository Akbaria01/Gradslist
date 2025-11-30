import { useState } from 'react';

export default function Help() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      question: "How do I post an item for sale?",
      answer: "After logging in, click 'List' and fill out the item details."
    },
    {
      question: "How do I contact a seller?",
      answer: "Click on any listing and use the 'Message Seller' button to start a conversation."
    },
    {
      question: "What payment methods are accepted?",
      answer: "Payment is arranged directly between buyers and sellers. We recommend cash for in person transactions."
    },
    {
      question: "What is the recommended meetup location page?",
      answer: "The meetup page shows safe, public locations where you can meet buyers or sellers. These are secure, high traffic areas like libraries and main plazas that provide security for both parties during transactions."
    }
  ];

  const tips = [
    {
      title: "Take Great Photos",
      description: "Use good lighting and multiple angles to showcase your items effectively."
    },
    {
      title: "Write Clear Descriptions",
      description: "Include condition, size, brand, and any defects to set proper expectations."
    },
    {
      title: "Price Competitively",
      description: "Research similar items to set a fair price that attracts buyers."
    },
    {
      title: "Respond Quickly",
      description: "Fast responses to messages increase your chances of making a sale."
    },
    {
      title: "Meet Safely",
      description: "Always meet in public locations during daylight hours."
    },
    {
      title: "Be Honest",
      description: "Accurate descriptions build trust and prevent disputes."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Help & Support</h1>
      
      {/* FAQ Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg">
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <span className="text-gray-500">
                  {openFaq === index ? '−' : '+'}
                </span>
              </button>
              {openFaq === index && (
                <div className="px-6 pb-4 text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Tips Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Tips for Success</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {tips.map((tip, index) => (
            <div key={index} className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">{tip.title}</h3>
              <p className="text-blue-800">{tip.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Still Need Help?</h2>
        <p className="text-gray-600 mb-4">
          Can't find what you're looking for? We're here to help!
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Contact Support
          </button>
          <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-100">
            Report an Issue
          </button>
        </div>
      </section>
    </div>
  );
}

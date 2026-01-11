const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'via.placeholder.com',
      'eu.chat-img.sintra.ai',
      'apkfamihczgzyxplksua.supabase.co',
      'apkfamihczgzyxplksua.storage.supabase.co',
    ],
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
};

module.exports = nextConfig;

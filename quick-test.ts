// Quick test without build - using ts-node
import { JarvisAgent } from './src/agent/core';

async function quickTest() {
  console.log('🧪 Quick Function Calling Test...\n');
  
  try {
    const agent = new JarvisAgent({ debug: false });
    
    console.log('📋 Available tools:', agent.getAvailableTools());
    
    console.log('\n⏰ Testing: "What time is it?"');
    const timeResult = await agent.processRequest('What time is it?');
    console.log('Response:', timeResult);
    
    console.log('\n📁 Testing: "List files in current directory"'); 
    const fileResult = await agent.processRequest('List files in current directory');
    console.log('Response:', fileResult);
    
    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

quickTest();
#!/usr/bin/env node

/**
 * 配置检查工具
 * 运行: node check-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查环境变量配置...\n');

const envPath = path.join(__dirname, '.env.local');

// 检查文件是否存在
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local 文件不存在！');
  console.log('💡 请先创建 .env.local 文件');
  process.exit(1);
}

// 读取文件内容
const envContent = fs.readFileSync(envPath, 'utf-8');

// 检查必需的变量
const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_GEMINI_API_KEY'
];

const issues = [];
const warnings = [];

requiredVars.forEach(varName => {
  const regex = new RegExp(`^${varName}=(.+)$`, 'm');
  const match = envContent.match(regex);
  
  if (!match) {
    issues.push(`❌ ${varName} 未设置`);
  } else {
    const value = match[1].trim();
    
    // 检查是否是占位符
    if (value.includes('your-') || value.includes('placeholder')) {
      issues.push(`⚠️  ${varName} 仍使用占位符值，请填入实际值`);
    } else {
      // 验证格式
      if (varName === 'VITE_SUPABASE_URL') {
        if (!value.startsWith('https://') || !value.includes('.supabase.co')) {
          warnings.push(`⚠️  ${varName} 格式可能不正确（应以 https:// 开头并包含 .supabase.co）`);
        } else {
          console.log(`✅ ${varName} 已设置`);
        }
      } else if (varName === 'VITE_SUPABASE_ANON_KEY') {
        if (!value.startsWith('eyJ')) {
          warnings.push(`⚠️  ${varName} 格式可能不正确（Supabase key 通常以 eyJ 开头）`);
        } else {
          console.log(`✅ ${varName} 已设置`);
        }
      } else if (varName === 'VITE_GEMINI_API_KEY') {
        if (value.length < 20) {
          warnings.push(`⚠️  ${varName} 长度似乎太短，请确认是否正确`);
        } else {
          console.log(`✅ ${varName} 已设置`);
        }
      }
    }
  }
});

console.log('\n');

if (issues.length > 0) {
  console.log('❌ 发现以下问题：');
  issues.forEach(issue => console.log(`   ${issue}`));
  console.log('\n');
}

if (warnings.length > 0) {
  console.log('⚠️  警告：');
  warnings.forEach(warning => console.log(`   ${warning}`));
  console.log('\n');
}

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ 所有配置检查通过！');
  console.log('\n💡 下一步：');
  console.log('   1. 确保 Supabase 数据库 schema 已运行（supabase/schema.sql）');
  console.log('   2. 运行 npm run dev 启动开发服务器');
  console.log('   3. 尝试登录/注册测试连接');
} else {
  console.log('📝 请按照以下步骤配置：');
  console.log('   1. 打开 .env.local 文件');
  console.log('   2. 填入 Supabase 配置（Dashboard > Settings > API）');
  console.log('   3. 填入 Gemini API Key（https://aistudio.google.com/）');
  console.log('   4. 保存文件后重新运行此检查');
}

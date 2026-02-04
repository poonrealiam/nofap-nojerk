/**
 * Database Service
 * 处理所有与 Supabase 数据库的交互
 */

import { supabase } from '../supabaseClient';
import { FoodEntry, Task, Post, PostComment } from '../types';

// ============================================
// Check-ins 相关函数
// ============================================

export const saveCheckIn = async (userId: string, date: string, status: 'check' | 'reset') => {
  const { data, error } = await supabase
    .from('check_ins')
    .upsert({
      user_id: userId,
      date: date,
      status: status
    }, {
      onConflict: 'user_id,date'
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving check-in:', error);
    throw error;
  }
  return data;
};

export const getCheckIns = async (userId: string) => {
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching check-ins:', error);
    throw error;
  }
  return data;
};

// ============================================
// Food Entries 相关函数
// ============================================

export const saveFoodEntry = async (userId: string, food: Omit<FoodEntry, 'id'>) => {
  const { data, error } = await supabase
    .from('food_entries')
    .insert({
      user_id: userId,
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      image_url: food.imageUrl,
      timestamp: food.timestamp
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving food entry:', error);
    throw error;
  }
  return data;
};

export const deleteFoodEntry = async (foodId: string) => {
  const { error } = await supabase
    .from('food_entries')
    .delete()
    .eq('id', foodId);

  if (error) {
    console.error('Error deleting food entry:', error);
    throw error;
  }
};

export const getFoodEntries = async (userId: string) => {
  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching food entries:', error);
    throw error;
  }
  return data;
};

// ============================================
// Tasks 相关函数
// ============================================

export const saveTask = async (userId: string, task: Omit<Task, 'id'>) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      text: task.text,
      completed: task.completed,
      created_at: task.createdAt
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving task:', error);
    throw error;
  }
  return data;
};

export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      text: updates.text,
      completed: updates.completed
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }
  return data;
};

export const deleteTask = async (taskId: string) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const getTasks = async (userId: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
  return data;
};

// ============================================
// Posts 相关函数
// ============================================

export const savePost = async (userId: string, post: Omit<Post, 'id' | 'author' | 'authorAvatar' | 'comments'>) => {
  const { data: profileData } = await supabase
    .from('profiles')
    .select('name, avatar_url, streak, relapse_count, preferences')
    .eq('id', userId)
    .single();

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      content: post.content,
      image_url: post.imageUrl,
      category: post.category,
      streak_at_time: profileData?.streak || 0,
      season_at_time: (profileData?.relapse_count || 0) + 1
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving post:', error);
    throw error;
  }

  // 更新用户的 last_post_date
  await supabase
    .from('profiles')
    .update({ last_post_date: new Date().toISOString().split('T')[0] })
    .eq('id', userId);

  return data;
};

export const updatePostLikes = async (postId: string, increment: number = 1) => {
  const { data: post } = await supabase
    .from('posts')
    .select('likes')
    .eq('id', postId)
    .single();

  const { data, error } = await supabase
    .from('posts')
    .update({ likes: (post?.likes || 0) + increment })
    .eq('id', postId)
    .select()
    .single();

  if (error) {
    console.error('Error updating post likes:', error);
    throw error;
  }
  return data;
};

export const getPosts = async () => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (
        name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
  return data;
};

// ============================================
// Comments 相关函数
// ============================================

export const saveComment = async (userId: string, postId: string, comment: Omit<PostComment, 'id' | 'author' | 'timestamp'>) => {
  const { data: profileData } = await supabase
    .from('profiles')
    .select('name, preferences, comments_today_count, is_founder')
    .eq('id', userId)
    .single();

  // 創始人不限留言次數；一般用戶每日 20 則
  if (!profileData?.is_founder && (profileData?.comments_today_count || 0) >= 20) {
    throw new Error('Daily comment quota exhausted');
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content: comment.content
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving comment:', error);
    throw error;
  }

  // 更新用户的评论计数
  await supabase
    .from('profiles')
    .update({ 
      comments_today_count: (profileData?.comments_today_count || 0) + 1 
    })
    .eq('id', userId);

  return data;
};

export const getComments = async (postId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles (
        name,
        avatar_url
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
  return data;
};

// ============================================
// Profile 相关函数
// ============================================

export const updateProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
  return data;
};

export const incrementAiUsage = async (userId: string, isPremium: boolean = false) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('daily_ai_usage, is_premium, is_founder')
    .eq('id', userId)
    .single();

  if (profile?.is_founder) {
    return { id: userId } as any;
  }

  const today = new Date().toISOString().split('T')[0];
  const currentUsage = profile?.daily_ai_usage || { date: '', count: 0 };
  const premium = isPremium || profile?.is_premium || false;
  
  // Premium 用户限制：每天 13 次，免费用户：每天 1 次
  const maxDailyLimit = premium ? 13 : 1;
  const currentCount = currentUsage.date === today ? (currentUsage.count || 0) : 0;

  if (currentCount >= maxDailyLimit) {
    throw new Error(premium 
      ? `每日 AI 分析配额已用完（${maxDailyLimit}次/天）`
      : '每日 AI 配额已用完。升级 Premium 可享受每天 13 次分析。');
  }

  // 如果是新的一天，重置计数
  const newUsage = currentUsage.date === today
    ? { ...currentUsage, count: currentCount + 1 }
    : { date: today, count: 1 };

  const { data, error } = await supabase
    .from('profiles')
    .update({ daily_ai_usage: newUsage })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error incrementing AI usage:', error);
    throw error;
  }
  return data;
};

export const checkBodyScanLimit = async (userId: string): Promise<{ allowed: boolean; lastScanDate?: string }> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('last_body_scan_date, is_premium, is_founder')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking body scan limit:', error);
      return { allowed: true };
    }

    if (profile?.is_founder) {
      return { allowed: true };
    }

    const premium = profile?.is_premium || false;
    const lastScanDate = profile?.last_body_scan_date;

    if (!premium) {
      return { allowed: false };
    }

    if (!lastScanDate) {
      return { allowed: true };
    }

    // Premium 用户：一周一次（7 天）
    const lastScan = new Date(lastScanDate);
    const now = new Date();
    const daysSinceLastScan = Math.floor((now.getTime() - lastScan.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastScan < 7) {
      return { 
        allowed: false, 
        lastScanDate: lastScanDate 
      };
    }

    return { allowed: true };
  } catch (err) {
    console.error('Error in checkBodyScanLimit:', err);
    // 发生错误时默认允许，避免阻塞用户
    return { allowed: true };
  }
};

// ============================================
// Invitation Code 相關函數
// ============================================

export const redeemInvitationCode = async (userId: string, code: string): Promise<void> => {
  const trimmedCode = code.trim().toUpperCase();
  if (!trimmedCode) {
    throw new Error('請輸入邀請碼');
  }

  const { data: codeRow, error: codeError } = await supabase
    .from('invitation_codes')
    .select('code, max_uses, used_count')
    .eq('code', trimmedCode)
    .single();

  if (codeError || !codeRow) {
    throw new Error('邀請碼無效');
  }
  if ((codeRow.used_count || 0) >= (codeRow.max_uses || 1)) {
    throw new Error('此邀請碼已達使用上限');
  }

  const { error: redeemError } = await supabase
    .from('invitation_redemptions')
    .insert({ user_id: userId, code: trimmedCode });

  if (redeemError) {
    if (redeemError.code === '23505') {
      throw new Error('您已兌換過邀請碼');
    }
    throw redeemError;
  }

  await supabase
    .from('invitation_codes')
    .update({ used_count: (codeRow.used_count || 0) + 1 })
    .eq('code', trimmedCode);

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_premium: true })
    .eq('id', userId);

  if (profileError) {
    console.error('Error updating profile for invitation:', profileError);
    throw profileError;
  }
};

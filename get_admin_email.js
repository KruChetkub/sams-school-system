import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nzyuuqfwzjadrrahmzbp.supabase.co'
const supabaseAnonKey = 'sb_publishable_Po-EUywKLA8J7iLAGUAWaQ_HpyTYs30'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function getTeachers() {
  const { data: teachers, error } = await supabase
    .from('teachers')
    .select('*')
  
  if (error) {
    console.error('Error fetching teachers:', error)
    return
  }
  
  console.log('All Teachers:')
  console.log(teachers)
}

getTeachers()

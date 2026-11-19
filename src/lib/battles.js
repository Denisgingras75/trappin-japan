import { supabase } from './supabase'

// Rounds of a battle, each with the beat it was recorded over. Falls back
// to the plain rows if the per-round beat relation isn't in the database.
export async function loadRounds(battleId) {
  let { data, error } = await supabase.from('freestyles')
    .select('*, beats(*)')
    .eq('battle_id', battleId)
    .order('round_number', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) {
    ({ data } = await supabase.from('freestyles')
      .select('*')
      .eq('battle_id', battleId)
      .order('round_number', { ascending: true })
      .order('created_at', { ascending: true }))
  }
  return data || []
}

// The beat a round plays over: its own, or the battle's original.
export const roundBeat = (round, battleBeat) => round?.beats || battleBeat || null

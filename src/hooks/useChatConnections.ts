/**
 * Chat connections hook
 * Manages chat connection state and operations
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { createRepositories } from '@/lib/repositories';
import { notifications, handleError } from '@/lib/notifications';
import { CHAT_CONFIG } from '@/config/constants';

export interface ChatConnection {
  id: string;
  full_name: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  is_online?: boolean;
  role?: 'patient' | 'pharmacist';
}

export interface ChatConnectionHook {
  connections: ChatConnection[];
  loading: boolean;
  error: string | null;
  activeConnectionId: string | null;
  setActiveConnection: (id: string | null) => void;
  clearActiveConnection: () => void;
  refreshConnections: () => Promise<void>;
  searchConnections: (query: string) => ChatConnection[];
}

export function useChatConnections(isPharmacy: boolean = false): ChatConnectionHook {
  const { user } = useUser();
  const [connections, setConnections] = useState<ChatConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConnections = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { connections: connectionsRepo } = createRepositories(supabase);
      
      let result;
      if (isPharmacy) {
        // Get connected patients for pharmacy
        result = await connectionsRepo.getConnectedPatients(user.id);
      } else {
        // Get connected pharmacies for patient
        result = await connectionsRepo.getConnectedPharmacies(user.id);
      }

      if (result) {
        const transformedConnections = result.map(conn => {
          // Handle both array and single object responses from profiles
          const profileData = conn.profiles;
          const profile = Array.isArray(profileData) ? profileData[0] : profileData;

          return {
            id: isPharmacy ? (conn as any).patient_id : (conn as any).pharmacy_id,
            full_name: profile?.full_name || 'Unknown',
            last_message: (conn as any).last_message,
            last_message_time: (conn as any).last_message_time,
            unread_count: (conn as any).unread_count || 0,
            is_online: Math.random() > 0.5, // Simulate online status
            role: isPharmacy ? 'patient' : 'pharmacist' as 'patient' | 'pharmacist',
          };
        });

        setConnections(transformedConnections);
      }
    } catch (err) {
      handleError(err, 'fetchConnections');
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  }, [user, isPharmacy]);

  const selectConnection = useCallback((connectionId: string | null) => {
    setActiveConnectionId(connectionId);
  }, []);

  const clearActiveConnection = useCallback(() => {
    setActiveConnectionId(null);
  }, []);

  const searchConnections = useCallback((query: string) => {
    if (!query.trim()) return connections;
    
    return connections.filter(conn =>
      conn.full_name.toLowerCase().includes(query.toLowerCase()) ||
      (conn.last_message && conn.last_message.toLowerCase().includes(query.toLowerCase()))
    );
  }, [connections]);

  // Auto-refresh connections
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Periodic refresh for new messages
  useEffect(() => {
    if (!user || connections.length === 0) return;

    const interval = setInterval(async () => {
      try {
        // Check for new messages and update last_message
        const { messages: messagesRepo } = createRepositories(supabase);
        
        for (const connection of connections) {
          const connectionId = isPharmacy ? connection.id : user.id;
          const otherId = isPharmacy ? user.id : connection.id;
          
          const recentMessages = await messagesRepo.getMessagesForUser(
            connectionId,
            1, // Get last message
            0
          );

          if (recentMessages && recentMessages.length > 0) {
            const lastMessage = recentMessages[0];
            setConnections(prev => {
              // Check if message is actually new before updating
              const existingConnection = prev.find(conn => conn.id === connection.id);
              if (!existingConnection || 
                  new Date(lastMessage.created_at) > new Date(existingConnection.last_message_time || 0)) {
                return prev.map(conn =>
                  conn.id === connection.id
                    ? { ...conn, last_message: lastMessage.content, last_message_time: lastMessage.created_at }
                    : conn
                );
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.error('Failed to refresh connections:', err);
      }
    }, CHAT_CONFIG.MESSAGE_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [user, isPharmacy, connections.length]); // Only depend on length, not entire array

  return {
    connections,
    loading,
    error,
    activeConnectionId,
    setActiveConnection: selectConnection,
    clearActiveConnection: clearActiveConnection,
    refreshConnections: fetchConnections,
    searchConnections,
  };
}
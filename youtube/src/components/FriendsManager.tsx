import React, { useState, useEffect, useRef } from 'react';
import { Search, Phone, Video, Users, UserPlus, Circle } from 'lucide-react';
import { getSignalingService } from '@/services/SignalingService';
import { useUser } from '@/lib/AuthContext';
import { addFriend, getFriends } from '@/services/friends';
import Link from 'next/link';
import { useCall } from '@/lib/CallContext';

interface Friend {
  id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
}

const FriendsManager: React.FC = () => {
  const { user } = useUser();
  const {
    startOutgoingCall,
  } = useCall();
  const signalingRef = useRef<ReturnType<typeof getSignalingService> | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [onlineIds, setOnlineIds] = useState<string[]>([]);
  const [addFriendValue, setAddFriendValue] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [addFriendStatus, setAddFriendStatus] = useState('');

  const mapFriends = (list: any[], online: string[]) => {
    return list.map((friend) => {
      const username =
        friend.channelname || friend.name || friend.email || 'Unknown User';
      const isOnline = online.includes(friend._id);
      return {
        id: friend._id,
        username,
        avatar: friend.image,
        isOnline,
        lastSeen: isOnline ? 'Online now' : 'Offline',
      } as Friend;
    });
  };

  useEffect(() => {
    const loadFriends = async () => {
      if (!user?._id) return;
      setLoading(true);
      setError('');
      try {
        const data = await getFriends(user._id);
        setFriends(mapFriends(data, onlineIds));
      } catch (err: any) {
        console.error('Failed to load friends:', err);
        setError('Failed to load friends. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadFriends();
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return;
    if (!signalingRef.current) {
      signalingRef.current = getSignalingService();
    }
    signalingRef.current.setUserId(user._id);

    const handlePresenceUpdate = (onlineIds: string[]) => {
      setOnlineIds(onlineIds);
      setFriends((prev) =>
        prev.map((friend) => ({
          ...friend,
          isOnline: onlineIds.includes(friend.id),
          lastSeen: onlineIds.includes(friend.id) ? 'Online now' : friend.lastSeen,
        }))
      );
    };

    signalingRef.current.on('presence:update', handlePresenceUpdate);

    return () => {
      signalingRef.current?.off('presence:update', handlePresenceUpdate);
    };
  }, [user?._id]);

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort friends: online first, then by last seen
  const sortedFriends = [...filteredFriends].sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    return 0;
  });

  const startVideoCall = (friend: Friend) => {
    startOutgoingCall(friend.id);
  };

  const handleAddFriend = async () => {
    if (!user?._id) return;
    const rawValue = addFriendValue.trim();
    if (!rawValue) return;
    setAddFriendStatus('');
    try {
      const normalized = rawValue.toLowerCase();
      if (!normalized.includes('@')) {
        setAddFriendStatus('Please enter a valid email address.');
        return;
      }
      const data = await addFriend(user._id, { email: normalized });
      setFriends(mapFriends(data, onlineIds));
      setAddFriendValue('');
      setAddFriendStatus('Friend added!');
    } catch (err: any) {
      console.error('Add friend failed:', err);
      setAddFriendStatus(
        err?.response?.data?.message || 'Unable to add friend. Check the email.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Friends</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Connect and video call with your friends
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/recordings"
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Recordings
              </Link>
              <button
                onClick={() => setShowAddFriend((prev) => !prev)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                <span>{showAddFriend ? 'Close' : 'Add Friend'}</span>
              </button>
            </div>
          </div>

          {showAddFriend && (
            <div className="mb-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Add a friend by email
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={addFriendValue}
                  onChange={(e) => setAddFriendValue(e.target.value)}
                  placeholder="Enter friend email"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={handleAddFriend}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              {addFriendStatus && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <Circle className="w-2 h-2 fill-blue-500 text-blue-500" />
                  <span>{addFriendStatus}</span>
                </div>
              )}
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading friends...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : sortedFriends.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {searchQuery ? 'No friends found matching your search' : 'No friends yet'}
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                {searchQuery ? 'Try a different search term' : 'Add friends to start connecting'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {friend.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                            friend.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                      </div>

                      {/* Friend Info */}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {friend.username}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {friend.isOnline ? (
                            <span className="flex items-center space-x-1">
                              <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                              <span>Online</span>
                            </span>
                          ) : (
                            <span>Last seen {friend.lastSeen}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startVideoCall(friend)}
                        disabled={!friend.isOnline}
                        className={`p-3 rounded-lg transition-colors ${
                          friend.isOnline
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                        title={friend.isOnline ? 'Start video call' : 'User is offline'}
                      >
                        <Video className="w-5 h-5" />
                      </button>
                      <button
                        disabled={!friend.isOnline}
                        className={`p-3 rounded-lg transition-colors ${
                          friend.isOnline
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                        title={friend.isOnline ? 'Start voice call' : 'User is offline'}
                      >
                        <Phone className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Circle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Online Friends</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {friends.filter(f => f.isOnline).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Friends</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {friends.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Available to Call</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {friends.filter(f => f.isOnline).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsManager;

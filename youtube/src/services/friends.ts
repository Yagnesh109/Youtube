import axiosInstance from "@/lib/axiosinstance";

export type FriendApi = {
  _id: string;
  name?: string;
  channelname?: string;
  email?: string;
  image?: string;
};

export const getFriends = async (userId: string) => {
  const { data } = await axiosInstance.get<FriendApi[]>(`/friends/${userId}`);
  return data;
};

export const addFriend = async (
  userId: string,
  identifier: { email: string }
) => {
  const { data } = await axiosInstance.post<FriendApi[]>(`/friends/${userId}`, {
    ...identifier,
  });
  return data;
};

export const removeFriend = async (userId: string, friendId: string) => {
  const { data } = await axiosInstance.delete<FriendApi[]>(
    `/friends/${userId}/${friendId}`
  );
  return data;
};

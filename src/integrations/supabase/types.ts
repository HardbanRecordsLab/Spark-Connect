export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      app_feature_flags: {
        Row: {
          enabled: boolean
          key: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          key: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          key?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      availability: {
        Row: {
          created_at: string
          expires_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blacklist: {
        Row: {
          banned_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          reason: string | null
          target_type: string
          target_value: string
        }
        Insert: {
          banned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          reason?: string | null
          target_type: string
          target_value: string
        }
        Update: {
          banned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          reason?: string | null
          target_type?: string
          target_value?: string
        }
        Relationships: []
      }
      chemistry_scores: {
        Row: {
          score: number
          updated_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          score?: number
          updated_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          score?: number
          updated_at?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          balance_after: number
          created_at: string
          delta: number
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          balance_after: number
          created_at?: string
          delta: number
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          delta?: number
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message: string | null
          last_message_at: string | null
          match_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          match_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          match_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string | null
          group_id: string
          id: string
          sender_id: string
          type: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          group_id: string
          id?: string
          sender_id: string
          type?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          group_id?: string
          id?: string
          sender_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          banner_style: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          emoji: string | null
          id: string
          is_live: boolean | null
          name: string
        }
        Insert: {
          banner_style?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_live?: boolean | null
          name: string
        }
        Update: {
          banner_style?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_live?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_user_state: {
        Row: {
          archived: boolean
          match_id: string
          muted: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean
          match_id: string
          muted?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archived?: boolean
          match_id?: string
          muted?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_user_state_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_user_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string | null
          id: string
          user1_id: string | null
          user2_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user1_id?: string | null
          user2_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user1_id?: string | null
          user2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          reply_to_id: string | null
          sender_id: string | null
          type: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          reply_to_id?: string | null
          sender_id?: string | null
          type?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          reply_to_id?: string | null
          sender_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      private_photo_requests: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      private_photos: {
        Row: {
          created_at: string
          id: string
          key: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key?: string | null
          url?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          admin_approved: boolean | null
          admin_rejected: boolean | null
          age: number | null
          allow_messages: string | null
          attracted_to: string[] | null
          avatar_url: string | null
          bdsm_prefs: string[] | null
          bio: string | null
          body_type: string | null
          bot_score: number | null
          breast_size: string | null
          chemistry_score: number | null
          children: string | null
          children_preference: string | null
          city: string | null
          coin_balance: number | null
          communication_style: string[] | null
          compatibility_score: number | null
          compatibility_type: string | null
          created_at: string | null
          day_rhythm: string | null
          dealbreakers: string | null
          dealbreakers_partner: string | null
          diet: string | null
          disclosure_level: string | null
          dislikes: string[] | null
          dislikes_list: string[] | null
          display_name: string
          donor_badge: boolean | null
          drinking: string | null
          education: string | null
          exhib_prefs: string[] | null
          eye_color: string | null
          face_verified: boolean | null
          gender: string | null
          gender_identity: string | null
          geom: unknown
          group_prefs: string[] | null
          hair_color: string | null
          height: number | null
          housing: string | null
          id: string
          incognito_mode: boolean | null
          intentions: string[] | null
          interests: string[] | null
          intimate_style: string[] | null
          is_bot_blocked: boolean | null
          is_secured: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          last_activity_timestamp: string | null
          last_online_at: string | null
          lat: number | null
          lifestyle_18: string | null
          likes: string[] | null
          likes_list: string[] | null
          lng: number | null
          looking_for: string[] | null
          looking_for_gender: string | null
          marriage_plans: string | null
          matches_count: number | null
          mbti: string | null
          mood: string | null
          mood_status: string | null
          occupation: string | null
          open_relationship: string | null
          orientation: string | null
          other_prefs_18: string[] | null
          passions_art: string[] | null
          passions_food: string[] | null
          passions_sport: string[] | null
          passions_tech: string[] | null
          passions_text: string | null
          passions_travel: string[] | null
          personality_match: string[] | null
          personality_tags: string[] | null
          personality_text: string | null
          pets: string | null
          photos: string[] | null
          piercing: string | null
          politics: string | null
          profile_complete: boolean | null
          profile_views: number | null
          profile_visibility: string | null
          pronouns: string | null
          pubic_hair: string | null
          rejection_reason: string | null
          relationship_goal: string | null
          relationship_style: string | null
          relationship_type: string | null
          religion: string | null
          relocation_readiness: string | null
          role_play_prefs: string[] | null
          safe_sex: string | null
          sex_description: string | null
          sexual_preferences: string[] | null
          sexual_role: string | null
          show_age: boolean | null
          show_city: boolean | null
          show_intimate: boolean | null
          smoking: string | null
          stealth_mode: boolean | null
          target_age_max: number | null
          target_age_min: number | null
          target_gender: string[] | null
          target_location: string | null
          tattoos: string | null
          total_likes: number | null
          updated_at: string | null
          values_tags: string[] | null
          verification_video_url: string | null
          zodiac: string | null
        }
        Insert: {
          activity_level?: string | null
          admin_approved?: boolean | null
          admin_rejected?: boolean | null
          age?: number | null
          allow_messages?: string | null
          attracted_to?: string[] | null
          avatar_url?: string | null
          bdsm_prefs?: string[] | null
          bio?: string | null
          body_type?: string | null
          bot_score?: number | null
          breast_size?: string | null
          chemistry_score?: number | null
          children?: string | null
          children_preference?: string | null
          city?: string | null
          coin_balance?: number | null
          communication_style?: string[] | null
          compatibility_score?: number | null
          compatibility_type?: string | null
          created_at?: string | null
          day_rhythm?: string | null
          dealbreakers?: string | null
          dealbreakers_partner?: string | null
          diet?: string | null
          disclosure_level?: string | null
          dislikes?: string[] | null
          dislikes_list?: string[] | null
          display_name: string
          donor_badge?: boolean | null
          drinking?: string | null
          education?: string | null
          exhib_prefs?: string[] | null
          eye_color?: string | null
          face_verified?: boolean | null
          gender?: string | null
          gender_identity?: string | null
          geom?: unknown
          group_prefs?: string[] | null
          hair_color?: string | null
          height?: number | null
          housing?: string | null
          id: string
          incognito_mode?: boolean | null
          intentions?: string[] | null
          interests?: string[] | null
          intimate_style?: string[] | null
          is_bot_blocked?: boolean | null
          is_secured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_activity_timestamp?: string | null
          last_online_at?: string | null
          lat?: number | null
          lifestyle_18?: string | null
          likes?: string[] | null
          likes_list?: string[] | null
          lng?: number | null
          looking_for?: string[] | null
          looking_for_gender?: string | null
          marriage_plans?: string | null
          matches_count?: number | null
          mbti?: string | null
          mood?: string | null
          mood_status?: string | null
          occupation?: string | null
          open_relationship?: string | null
          orientation?: string | null
          other_prefs_18?: string[] | null
          passions_art?: string[] | null
          passions_food?: string[] | null
          passions_sport?: string[] | null
          passions_tech?: string[] | null
          passions_text?: string | null
          passions_travel?: string[] | null
          personality_match?: string[] | null
          personality_tags?: string[] | null
          personality_text?: string | null
          pets?: string | null
          photos?: string[] | null
          piercing?: string | null
          politics?: string | null
          profile_complete?: boolean | null
          profile_views?: number | null
          profile_visibility?: string | null
          pronouns?: string | null
          pubic_hair?: string | null
          rejection_reason?: string | null
          relationship_goal?: string | null
          relationship_style?: string | null
          relationship_type?: string | null
          religion?: string | null
          relocation_readiness?: string | null
          role_play_prefs?: string[] | null
          safe_sex?: string | null
          sex_description?: string | null
          sexual_preferences?: string[] | null
          sexual_role?: string | null
          show_age?: boolean | null
          show_city?: boolean | null
          show_intimate?: boolean | null
          smoking?: string | null
          stealth_mode?: boolean | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_gender?: string[] | null
          target_location?: string | null
          tattoos?: string | null
          total_likes?: number | null
          updated_at?: string | null
          values_tags?: string[] | null
          verification_video_url?: string | null
          zodiac?: string | null
        }
        Update: {
          activity_level?: string | null
          admin_approved?: boolean | null
          admin_rejected?: boolean | null
          age?: number | null
          allow_messages?: string | null
          attracted_to?: string[] | null
          avatar_url?: string | null
          bdsm_prefs?: string[] | null
          bio?: string | null
          body_type?: string | null
          bot_score?: number | null
          breast_size?: string | null
          chemistry_score?: number | null
          children?: string | null
          children_preference?: string | null
          city?: string | null
          coin_balance?: number | null
          communication_style?: string[] | null
          compatibility_score?: number | null
          compatibility_type?: string | null
          created_at?: string | null
          day_rhythm?: string | null
          dealbreakers?: string | null
          dealbreakers_partner?: string | null
          diet?: string | null
          disclosure_level?: string | null
          dislikes?: string[] | null
          dislikes_list?: string[] | null
          display_name?: string
          donor_badge?: boolean | null
          drinking?: string | null
          education?: string | null
          exhib_prefs?: string[] | null
          eye_color?: string | null
          face_verified?: boolean | null
          gender?: string | null
          gender_identity?: string | null
          geom?: unknown
          group_prefs?: string[] | null
          hair_color?: string | null
          height?: number | null
          housing?: string | null
          id?: string
          incognito_mode?: boolean | null
          intentions?: string[] | null
          interests?: string[] | null
          intimate_style?: string[] | null
          is_bot_blocked?: boolean | null
          is_secured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_activity_timestamp?: string | null
          last_online_at?: string | null
          lat?: number | null
          lifestyle_18?: string | null
          likes?: string[] | null
          likes_list?: string[] | null
          lng?: number | null
          looking_for?: string[] | null
          looking_for_gender?: string | null
          marriage_plans?: string | null
          matches_count?: number | null
          mbti?: string | null
          mood?: string | null
          mood_status?: string | null
          occupation?: string | null
          open_relationship?: string | null
          orientation?: string | null
          other_prefs_18?: string[] | null
          passions_art?: string[] | null
          passions_food?: string[] | null
          passions_sport?: string[] | null
          passions_tech?: string[] | null
          passions_text?: string | null
          passions_travel?: string[] | null
          personality_match?: string[] | null
          personality_tags?: string[] | null
          personality_text?: string | null
          pets?: string | null
          photos?: string[] | null
          piercing?: string | null
          politics?: string | null
          profile_complete?: boolean | null
          profile_views?: number | null
          profile_visibility?: string | null
          pronouns?: string | null
          pubic_hair?: string | null
          rejection_reason?: string | null
          relationship_goal?: string | null
          relationship_style?: string | null
          relationship_type?: string | null
          religion?: string | null
          relocation_readiness?: string | null
          role_play_prefs?: string[] | null
          safe_sex?: string | null
          sex_description?: string | null
          sexual_preferences?: string[] | null
          sexual_role?: string | null
          show_age?: boolean | null
          show_city?: boolean | null
          show_intimate?: boolean | null
          smoking?: string | null
          stealth_mode?: boolean | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_gender?: string[] | null
          target_location?: string | null
          tattoos?: string | null
          total_likes?: number | null
          updated_at?: string | null
          values_tags?: string[] | null
          verification_video_url?: string | null
          zodiac?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          count: number
          id: string
          user_id: string
          window_start: string
        }
        Insert: {
          action: string
          count?: number
          id?: string
          user_id: string
          window_start?: string
        }
        Update: {
          action?: string
          count?: number
          id?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          clicked_at: string | null
          code: string
          completed_at: string | null
          created_at: string
          id: string
          referee_id: string | null
          referrer_id: string
          reward_given: boolean
        }
        Insert: {
          clicked_at?: string | null
          code: string
          completed_at?: string | null
          created_at?: string
          id?: string
          referee_id?: string | null
          referrer_id: string
          reward_given?: boolean
        }
        Update: {
          clicked_at?: string | null
          code?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          referee_id?: string | null
          referrer_id?: string
          reward_given?: boolean
        }
        Relationships: []
      }
      reports: {
        Row: {
          category: string | null
          created_at: string | null
          details: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roulette_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          event_id: string | null
          id: string
          status: string
          user_a: string
          user_b: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          event_id?: string | null
          id?: string
          status?: string
          user_a: string
          user_b?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          event_id?: string | null
          id?: string
          status?: string
          user_a?: string
          user_b?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roulette_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "speed_dating_events"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_spicy: boolean | null
          likes_count: number | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_spicy?: boolean | null
          likes_count?: number | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_spicy?: boolean | null
          likes_count?: number | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      speed_dating_events: {
        Row: {
          capacity: number
          category: string | null
          created_at: string | null
          emoji: string | null
          id: string
          round_minutes: number
          rounds: number
          start_time: string
          title: string
        }
        Insert: {
          capacity?: number
          category?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          round_minutes?: number
          rounds?: number
          start_time: string
          title: string
        }
        Update: {
          capacity?: number
          category?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          round_minutes?: number
          rounds?: number
          start_time?: string
          title?: string
        }
        Relationships: []
      }
      speed_dating_registrations: {
        Row: {
          event_id: string
          registered_at: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          registered_at?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          registered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "speed_dating_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "speed_dating_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speed_dating_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message: string | null
          owner_id: string
          reactor_id: string
          story_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message?: string | null
          owner_id: string
          reactor_id: string
          story_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message?: string | null
          owner_id?: string
          reactor_id?: string
          story_id?: string
        }
        Relationships: []
      }
      super_swipes: {
        Row: {
          created_at: string
          id: string
          message: string | null
          receiver_id: string
          seen: boolean
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_id: string
          seen?: boolean
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_id?: string
          seen?: boolean
          sender_id?: string
        }
        Relationships: []
      }
      swipes: {
        Row: {
          created_at: string | null
          direction: string
          id: string
          is_super: boolean
          swiped_id: string
          swiper_id: string
        }
        Insert: {
          created_at?: string | null
          direction: string
          id?: string
          is_super?: boolean
          swiped_id: string
          swiper_id: string
        }
        Update: {
          created_at?: string | null
          direction?: string
          id?: string
          is_super?: boolean
          swiped_id?: string
          swiper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipes_swiped_id_fkey"
            columns: ["swiped_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_swiper_id_fkey"
            columns: ["swiper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          allow_whispers: boolean | null
          blur_for_unverified: boolean | null
          blur_nsfw_feed: boolean | null
          hide_from_search: boolean | null
          invisible_mode: boolean | null
          notif_likes: boolean | null
          notif_live: boolean | null
          notif_matches: boolean | null
          notif_messages: boolean | null
          notif_promotions: boolean | null
          notif_stories: boolean | null
          read_receipts: boolean | null
          secured_mode: boolean | null
          show_distance: boolean | null
          show_last_seen: boolean | null
          show_online: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_whispers?: boolean | null
          blur_for_unverified?: boolean | null
          blur_nsfw_feed?: boolean | null
          hide_from_search?: boolean | null
          invisible_mode?: boolean | null
          notif_likes?: boolean | null
          notif_live?: boolean | null
          notif_matches?: boolean | null
          notif_messages?: boolean | null
          notif_promotions?: boolean | null
          notif_stories?: boolean | null
          read_receipts?: boolean | null
          secured_mode?: boolean | null
          show_distance?: boolean | null
          show_last_seen?: boolean | null
          show_online?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_whispers?: boolean | null
          blur_for_unverified?: boolean | null
          blur_nsfw_feed?: boolean | null
          hide_from_search?: boolean | null
          invisible_mode?: boolean | null
          notif_likes?: boolean | null
          notif_live?: boolean | null
          notif_matches?: boolean | null
          notif_messages?: boolean | null
          notif_promotions?: boolean | null
          notif_stories?: boolean | null
          read_receipts?: boolean | null
          secured_mode?: boolean | null
          show_distance?: boolean | null
          show_last_seen?: boolean | null
          show_online?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          created_at: string
          id: string
          photo_key: string
          reject_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_key: string
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_key?: string
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      whisper_messages: {
        Row: {
          created_at: string
          id: string
          is_revealed: boolean
          message: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_revealed?: boolean
          message: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_revealed?: boolean
          message?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      adjust_coin_balance: {
        Args: { p_delta: number; p_reason?: string }
        Returns: number
      }
      admin_review_verification: {
        Args: { p_approve: boolean; p_reason?: string; p_request_id: string }
        Returns: undefined
      }
      check_rate_limit: {
        Args: { p_action: string; p_limit: number }
        Returns: boolean
      }
      claim_ad_coins: { Args: never; Returns: number }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_online_users_count: { Args: never; Returns: number }
      get_who_liked_me: {
        Args: never
        Returns: {
          age: number
          avatar_url: string
          city: string
          display_name: string
          id: string
          photos: string[]
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      heartbeat_presence: { Args: never; Returns: undefined }
      increment_profile_likes: {
        Args: { profile_id: string }
        Returns: undefined
      }
      increment_profile_views: {
        Args: { profile_id: string }
        Returns: undefined
      }
      is_admin_user: { Args: { _user_id: string }; Returns: boolean }
      is_banned: { Args: never; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      profiles_near_point: {
        Args: {
          exclude_ids?: string[]
          radius_m?: number
          ref_lat: number
          ref_lng: number
        }
        Returns: {
          admin_approved: boolean
          age: number
          avatar_url: string
          bio: string
          chemistry_score: number
          city: string
          display_name: string
          distance_m: number
          gender: string
          id: string
          interests: string[]
          is_verified: boolean
          mood_status: string
          orientation: string
          photos: string[]
          relationship_type: string
        }[]
      }
      record_swipe: {
        Args: { p_direction: string; p_swiped_id: string }
        Returns: {
          match_id: string
          matched: boolean
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

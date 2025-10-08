  const createPost = useMutation(api.socialPosts.createSocialPost);
  const updatePost = useMutation(api.socialPosts.updateSocialPost);
  const generateUploadUrl = useAction(api.files.generateUploadUrl);
  const generateSocialContent = useAction(api.socialContentAgent.generateSocialContent);
const generateSocialContent = useAction(api.socialContentAgent.generateSocialContent);

// Calculate character count for each platform
const getCharacterCount = (platform: PlatformId) => {
  const count = content.length;
  const limit = PLATFORM_LIMITS[platform];
  return { count, limit, remaining: limit - count, isOver: count > limit };
};

// AI content generation
const handleAIGenerate = async () => {
  if (selectedPlatforms.length === 0) {
    toast.error("Please select at least one platform first");
    return;
  }

  setIsGenerating(true);
  try {
    const result = await generateSocialContent({
      businessId,
      platforms: selectedPlatforms,
      topic: content || "business automation and productivity",
      tone: "professional",
      includeHashtags: true,
      includeEmojis: true,
    });

    // Use content from the first selected platform
    const firstPlatform = selectedPlatforms[0];
    const generatedContent = result[firstPlatform];

    if (generatedContent) {
      const hashtags = generatedContent.hashtags.map((h: string) => `#${h}`).join(" ");
      const fullContent = `${generatedContent.content}\n\n${hashtags}`;
      setContent(fullContent);
      toast.success(`AI content generated! (${generatedContent.characterCount} characters)`);
    } else {
      toast.error("Failed to generate content for selected platform");
    }
  } catch (error) {
    console.error("AI generation error:", error);
    toast.error("Failed to generate content. Please try again.");
  } finally {
    setIsGenerating(false);
  }
};
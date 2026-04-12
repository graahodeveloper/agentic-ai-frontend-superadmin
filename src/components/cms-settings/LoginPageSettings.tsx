'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  useGetCMSByPageTypeQuery,
  useCreateCMSSettingsMutation,
  usePatchCMSSettingsMutation,
  useUploadCMSImageMutation,
  FloatingElement,
  HeroImage,
} from '@/features/cmsSettings/cmsSettingsApi';

interface FormData {
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_cta_text: string;
  hero_cta_link: string;
  hero_image_url: string;
  hero_images: HeroImage[];
  logo_url: string;
  floating_elements: FloatingElement[];
  background_gradient: string;
}

const DEFAULT_FORM_DATA: FormData = {
  hero_title: 'High-conversion marketing insights',
  hero_subtitle: 'Real-time monitoring of activity data, through funnel analysis',
  hero_description: 'to help brands achieve explosive business growth.',
  hero_cta_text: 'Watch Demo',
  hero_cta_link: '/demo',
  hero_image_url: '',
  hero_images: [],
  logo_url: '',
  floating_elements: [],
  background_gradient: 'linear-gradient(135deg, #262782 0%, #3d3fa0 55%, #7071AB 100%)',
};

export default function LoginPageSettings() {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHeroSlider, setUploadingHeroSlider] = useState<number | null>(null);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);

  const logoImageRef = useRef<HTMLInputElement>(null);

  // API hooks
  const { data: cmsData, isLoading, error, refetch } = useGetCMSByPageTypeQuery('login');
  const [createCMS] = useCreateCMSSettingsMutation();
  const [patchCMS] = usePatchCMSSettingsMutation();
  const [uploadImage] = useUploadCMSImageMutation();

  // Load existing data
  useEffect(() => {
    if (cmsData?.exists && cmsData.content) {
      const content = cmsData.content;
      setExistingId(content.id);
      setFormData({
        hero_title: content.hero_title || DEFAULT_FORM_DATA.hero_title,
        hero_subtitle: content.hero_subtitle || DEFAULT_FORM_DATA.hero_subtitle,
        hero_description: content.hero_description || DEFAULT_FORM_DATA.hero_description,
        hero_cta_text: content.hero_cta_text || DEFAULT_FORM_DATA.hero_cta_text,
        hero_cta_link: content.hero_cta_link || DEFAULT_FORM_DATA.hero_cta_link,
        hero_image_url: content.hero_image_url || '',
        hero_images: content.hero_images || [],
        logo_url: content.logo_url || '',
        floating_elements: content.floating_elements || [],
        background_gradient: content.background_gradient || DEFAULT_FORM_DATA.background_gradient,
      });
    }
  }, [cmsData]);

  // Handle image upload
  const handleImageUpload = async (
    file: File,
    imageType: 'logo' | 'hero_slider',
    sliderIndex?: number
  ) => {
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    formDataUpload.append('page_type', 'login');
    formDataUpload.append('image_type', imageType);

    try {
      if (imageType === 'logo') setUploadingLogo(true);
      else if (imageType === 'hero_slider' && sliderIndex !== undefined) setUploadingHeroSlider(sliderIndex);

      const response = await uploadImage(formDataUpload).unwrap();

      if (imageType === 'logo') {
        setFormData((prev) => ({ ...prev, logo_url: response.image_url }));
      } else if (imageType === 'hero_slider' && sliderIndex !== undefined) {
        setFormData((prev) => {
          const newImages = [...prev.hero_images];
          newImages[sliderIndex] = { ...newImages[sliderIndex], url: response.image_url };
          return { ...prev, hero_images: newImages };
        });
      }

      setSaveMessage({ type: 'success', text: 'Image uploaded successfully!' });
    } catch (err) {
      console.error('Upload error:', err);
      setSaveMessage({ type: 'error', text: 'Failed to upload image. Please try again.' });
    } finally {
      setUploadingLogo(false);
      setUploadingHeroSlider(null);
    }
  };

  // Handle file input change
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    imageType: 'logo' | 'hero_slider',
    sliderIndex?: number
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, imageType, sliderIndex);
    }
  };

  // Add hero slider image
  const addHeroSliderImage = () => {
    setFormData((prev) => ({
      ...prev,
      hero_images: [
        ...prev.hero_images,
        { url: '', alt: `Slide ${prev.hero_images.length + 1}` },
      ],
    }));
  };

  // Remove hero slider image
  const removeHeroSliderImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      hero_images: prev.hero_images.filter((_, i) => i !== index),
    }));
    if (previewSlideIndex >= formData.hero_images.length - 1) {
      setPreviewSlideIndex(Math.max(0, formData.hero_images.length - 2));
    }
  };

  // Move slider image up/down
  const moveHeroSliderImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...formData.hero_images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setFormData((prev) => ({ ...prev, hero_images: newImages }));
  };

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      if (existingId) {
        await patchCMS({ id: existingId, data: formData }).unwrap();
      } else {
        const result = await createCMS({ page_type: 'login', ...formData }).unwrap();
        setExistingId(result.id);
      }
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      refetch();
    } catch (err) {
      console.error('Save error:', err);
      setSaveMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Clear message after 3 seconds
  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  // Auto-rotate preview slider
  useEffect(() => {
    if (formData.hero_images.length > 1) {
      const interval = setInterval(() => {
        setPreviewSlideIndex((prev) => (prev + 1) % formData.hero_images.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [formData.hero_images.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4318ff]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-semibold text-gray-900">Failed to load settings</h3>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-[#4318ff] text-white rounded-lg hover:bg-[#3614cc]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Login Page Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Customize the login page content, images, and branding for your users.
        </p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            saveMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="space-y-6">
          {/* Hero Content Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hero Content</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Main Title</label>
                <input
                  type="text"
                  value={formData.hero_title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hero_title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4318ff] focus:border-transparent"
                  placeholder="High-conversion marketing insights"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={formData.hero_subtitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hero_subtitle: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4318ff] focus:border-transparent"
                  placeholder="Real-time monitoring of activity data"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.hero_description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hero_description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4318ff] focus:border-transparent resize-none"
                  placeholder="to help brands achieve explosive business growth."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={formData.hero_cta_text}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hero_cta_text: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4318ff] focus:border-transparent"
                    placeholder="Watch Demo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CTA Link</label>
                  <input
                    type="text"
                    value={formData.hero_cta_link}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hero_cta_link: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4318ff] focus:border-transparent"
                    placeholder="/demo"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hero Slider Images Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Hero Slider Images</h2>
                <p className="text-sm text-gray-500">Images will auto-rotate in the slider above the title</p>
              </div>
              <button
                onClick={addHeroSliderImage}
                className="px-3 py-1.5 text-sm bg-[#4318ff] text-white rounded-lg hover:bg-[#3614cc] transition-colors"
              >
                + Add Image
              </button>
            </div>

            {formData.hero_images.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">No slider images added yet.</p>
                <p className="text-xs text-gray-400 mt-1">Add images to create an auto-rotating slider</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.hero_images.map((image, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    {/* Image Preview */}
                    <div
                      className="w-24 h-18 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#4318ff] transition-colors flex-shrink-0"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e: Event) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleImageUpload(file, 'hero_slider', index);
                        };
                        input.click();
                      }}
                    >
                      {uploadingHeroSlider === index ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#4318ff]"></div>
                      ) : image.url ? (
                        <img src={image.url} alt={image.alt} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-gray-400 text-center px-1">Click to upload</span>
                      )}
                    </div>

                    {/* Order & Alt Text */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">Slide {index + 1}</span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => moveHeroSliderImage(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveHeroSliderImage(index, 'down')}
                            disabled={index === formData.hero_images.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={image.alt || ''}
                        onChange={(e) => {
                          const newImages = [...formData.hero_images];
                          newImages[index] = { ...newImages[index], alt: e.target.value };
                          setFormData((prev) => ({ ...prev, hero_images: newImages }));
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#4318ff]"
                        placeholder="Image description (alt text)"
                      />
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => removeHeroSliderImage(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logo Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo</h2>

            <div className="flex items-start space-x-4">
              <div
                className="w-32 h-16 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#4318ff] transition-colors"
                onClick={() => logoImageRef.current?.click()}
              >
                {uploadingLogo ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#4318ff]"></div>
                ) : formData.logo_url ? (
                  <img src={formData.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400 text-center px-2">Click to upload</span>
                )}
              </div>
              <input
                ref={logoImageRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'logo')}
                className="hidden"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={formData.logo_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, logo_url: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4318ff] focus:border-transparent"
                  placeholder="Or enter logo URL"
                />
                <p className="mt-1 text-xs text-gray-500">Recommended: 180x80px, PNG with transparency</p>
              </div>
            </div>
          </div>

          {/* Styling Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Styling</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Gradient</label>
              <input
                type="text"
                value={formData.background_gradient}
                onChange={(e) => setFormData((prev) => ({ ...prev, background_gradient: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4318ff] focus:border-transparent font-mono text-sm"
                placeholder="linear-gradient(135deg, #262782 0%, #3d3fa0 55%, #7071AB 100%)"
              />
              <div
                className="mt-2 h-12 rounded-lg"
                style={{ background: formData.background_gradient }}
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 bg-[#4318ff] text-white font-semibold rounded-xl hover:bg-[#3614cc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>

        {/* Preview Section */}
        <div className="lg:sticky lg:top-6 h-fit">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
              <p className="text-xs text-gray-500">This shows how the login page will look</p>
            </div>

            {/* Preview Container */}
            <div className="aspect-[16/10] relative overflow-hidden">
              <div className="absolute inset-0 flex">
                {/* Left Side - Login Form Preview */}
                <div className="w-1/2 bg-white p-4 flex flex-col items-center justify-center">
                  {/* Logo Preview */}
                  <div className="mb-3">
                    {formData.logo_url ? (
                      <img src={formData.logo_url} alt="Logo" className="h-8 object-contain" />
                    ) : (
                      <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                    )}
                  </div>

                  {/* Mock Form */}
                  <div className="w-full max-w-[140px] space-y-2">
                    <div className="h-2 w-1/2 bg-gray-200 rounded"></div>
                    <div className="h-5 bg-gray-100 rounded border border-gray-200"></div>
                    <div className="h-2 w-1/3 bg-gray-200 rounded"></div>
                    <div className="h-5 bg-gray-100 rounded border border-gray-200"></div>
                    <div className="h-5 bg-[#4318ff] rounded mt-3"></div>
                  </div>
                </div>

                {/* Right Side - Hero Preview */}
                <div
                  className="w-1/2 p-4 flex flex-col items-center justify-center text-white relative"
                  style={{ background: formData.background_gradient }}
                >
                  {/* Hero Slider Preview */}
                  {formData.hero_images.length > 0 ? (
                    <div className="w-3/4 aspect-[4/3] relative mb-3 overflow-hidden rounded-lg">
                      {formData.hero_images.map((image, index) => (
                        image.url && (
                          <div
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-500 ${
                              index === previewSlideIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                          >
                            <img
                              src={image.url}
                              alt={image.alt}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )
                      ))}
                      {/* Dots Indicator */}
                      {formData.hero_images.length > 1 && (
                        <div className="absolute bottom-1 left-0 right-0 flex justify-center space-x-1">
                          {formData.hero_images.map((_, index) => (
                            <div
                              key={index}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                index === previewSlideIndex ? 'bg-white w-3' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-3/4 aspect-[4/3] bg-white/10 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-[8px] opacity-50">Add slider images</span>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-xs font-semibold text-center mb-1 px-2 leading-tight">
                    {formData.hero_title || 'Your Title Here'}
                  </h3>
                  <p className="text-[8px] text-center opacity-80 px-2">
                    {formData.hero_subtitle}
                  </p>

                  {/* Page Indicator */}
                  <div className="absolute bottom-3 flex items-center justify-center gap-1">
                    <div className="w-4 h-1 bg-white rounded-full" />
                    <div className="w-1 h-1 bg-white/40 rounded-full" />
                    <div className="w-1 h-1 bg-white/40 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Note */}
          <p className="mt-4 text-xs text-gray-500 text-center">
            Note: The actual login page will be fully responsive. This is a scaled preview.
          </p>
        </div>
      </div>
    </div>
  );
}

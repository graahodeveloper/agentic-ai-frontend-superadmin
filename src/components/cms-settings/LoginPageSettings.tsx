'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [expandedSlide, setExpandedSlide] = useState<number | null>(null);

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

  // Add hero slider image with default content
  const addHeroSliderImage = () => {
    const newSlide: HeroImage = {
      url: '',
      alt: `Slide ${formData.hero_images.length + 1}`,
      title: formData.hero_title || 'Your Title Here',
      subtitle: formData.hero_subtitle || 'Your subtitle here',
      description: formData.hero_description || 'Your description here',
      cta_text: formData.hero_cta_text || 'Watch Demo',
      cta_link: formData.hero_cta_link || '/demo',
    };
    setFormData((prev) => ({
      ...prev,
      hero_images: [...prev.hero_images, newSlide],
    }));
    // Auto expand the newly added slide
    setExpandedSlide(formData.hero_images.length);
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
    if (expandedSlide === index) {
      setExpandedSlide(null);
    }
  };

  // Move slider image up/down
  const moveHeroSliderImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...formData.hero_images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setFormData((prev) => ({ ...prev, hero_images: newImages }));
    if (expandedSlide === index) {
      setExpandedSlide(targetIndex);
    } else if (expandedSlide === targetIndex) {
      setExpandedSlide(index);
    }
  };

  // Update slide field
  const updateSlideField = (index: number, field: keyof HeroImage, value: string) => {
    setFormData((prev) => {
      const newImages = [...prev.hero_images];
      newImages[index] = { ...newImages[index], [field]: value };
      return { ...prev, hero_images: newImages };
    });
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
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [formData.hero_images.length]);

  // Get current slide content for preview
  const getCurrentSlideContent = () => {
    if (formData.hero_images.length > 0 && formData.hero_images[previewSlideIndex]) {
      const slide = formData.hero_images[previewSlideIndex];
      return {
        title: slide.title || formData.hero_title,
        subtitle: slide.subtitle || formData.hero_subtitle,
        description: slide.description || formData.hero_description,
        cta_text: slide.cta_text || formData.hero_cta_text,
        cta_link: slide.cta_link || formData.hero_cta_link,
      };
    }
    return {
      title: formData.hero_title,
      subtitle: formData.hero_subtitle,
      description: formData.hero_description,
      cta_text: formData.hero_cta_text,
      cta_link: formData.hero_cta_link,
    };
  };

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

  const currentContent = getCurrentSlideContent();

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
          {/* Default Hero Content Card (fallback when no slides) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Default Hero Content</h2>
            <p className="text-xs text-gray-500 mb-4">
              This content is used as fallback when slides don&apos;t have their own text, or as template for new slides.
            </p>

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
                <input
                  type="text"
                  value={formData.hero_description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hero_description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4318ff] focus:border-transparent"
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
                <h2 className="text-lg font-semibold text-gray-900">Hero Slides</h2>
                <p className="text-sm text-gray-500">Each slide has its own image and text content</p>
              </div>
              <button
                onClick={addHeroSliderImage}
                className="px-3 py-1.5 text-sm bg-[#4318ff] text-white rounded-lg hover:bg-[#3614cc] transition-colors"
              >
                + Add Slide
              </button>
            </div>

            {formData.hero_images.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">No slides added yet.</p>
                <p className="text-xs text-gray-400 mt-1">Add slides to create an auto-rotating slider with custom text</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.hero_images.map((image, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Slide Header */}
                    <div
                      className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setExpandedSlide(expandedSlide === index ? null : index)}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Image Preview Thumbnail */}
                        <div
                          className="w-16 h-12 bg-white rounded border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (ev: Event) => {
                              const file = (ev.target as HTMLInputElement).files?.[0];
                              if (file) handleImageUpload(file, 'hero_slider', index);
                            };
                            input.click();
                          }}
                        >
                          {uploadingHeroSlider === index ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4318ff]"></div>
                          ) : image.url ? (
                            <img src={image.url} alt={image.alt} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[8px] text-gray-400 text-center">Upload</span>
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Slide {index + 1}</span>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">
                            {image.title || 'No title set'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Move buttons */}
                        <button
                          onClick={(e) => { e.stopPropagation(); moveHeroSliderImage(index, 'up'); }}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveHeroSliderImage(index, 'down'); }}
                          disabled={index === formData.hero_images.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeHeroSliderImage(index); }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        {/* Expand/Collapse icon */}
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${expandedSlide === index ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Expanded Slide Content */}
                    {expandedSlide === index && (
                      <div className="p-4 space-y-4 bg-white border-t border-gray-200">
                        {/* Image URL */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Image URL (or click thumbnail to upload)</label>
                          <input
                            type="text"
                            value={image.url || ''}
                            onChange={(e) => updateSlideField(index, 'url', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#4318ff]"
                            placeholder="https://..."
                          />
                        </div>

                        {/* Alt Text */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Alt Text</label>
                          <input
                            type="text"
                            value={image.alt || ''}
                            onChange={(e) => updateSlideField(index, 'alt', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#4318ff]"
                            placeholder="Image description"
                          />
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                          <h4 className="text-sm font-medium text-gray-800 mb-3">Slide Text Content</h4>

                          {/* Title */}
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                            <input
                              type="text"
                              value={image.title || ''}
                              onChange={(e) => updateSlideField(index, 'title', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#4318ff]"
                              placeholder="Slide title"
                            />
                          </div>

                          {/* Subtitle */}
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Subtitle</label>
                            <input
                              type="text"
                              value={image.subtitle || ''}
                              onChange={(e) => updateSlideField(index, 'subtitle', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#4318ff]"
                              placeholder="Slide subtitle"
                            />
                          </div>

                          {/* Description */}
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={image.description || ''}
                              onChange={(e) => updateSlideField(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#4318ff]"
                              placeholder="Slide description"
                            />
                          </div>

                          {/* CTA */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">CTA Text</label>
                              <input
                                type="text"
                                value={image.cta_text || ''}
                                onChange={(e) => updateSlideField(index, 'cta_text', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#4318ff]"
                                placeholder="Watch Demo"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">CTA Link</label>
                              <input
                                type="text"
                                value={image.cta_link || ''}
                                onChange={(e) => updateSlideField(index, 'cta_link', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#4318ff]"
                                placeholder="/demo"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
              <p className="text-xs text-gray-500">This shows how the login page will look (text changes per slide)</p>
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

                {/* Right Side - Hero Preview with rounded corners */}
                <div
                  className="w-1/2 p-4 flex flex-col items-center justify-center text-white relative rounded-l-3xl"
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
                      {/* Dots Indicator - moved to right side */}
                      {formData.hero_images.length > 1 && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col space-y-1">
                          {formData.hero_images.map((_, index) => (
                            <div
                              key={index}
                              onClick={() => setPreviewSlideIndex(index)}
                              className={`cursor-pointer transition-all rounded-full ${
                                index === previewSlideIndex ? 'h-4 w-1.5 bg-white' : 'h-1.5 w-1.5 bg-white/50'
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

                  {/* Dynamic Title based on current slide */}
                  <h3 className="text-xs font-semibold text-center mb-1 px-2 leading-tight transition-all duration-300">
                    {currentContent.title || 'Your Title Here'}
                  </h3>
                  <p className="text-[8px] text-center opacity-80 px-2 transition-all duration-300">
                    {currentContent.subtitle}
                  </p>
                  <p className="text-[7px] text-center opacity-60 px-2 transition-all duration-300">
                    {currentContent.description}
                  </p>

                  {/* CTA Button */}
                  {currentContent.cta_text && (
                    <div className="mt-2 px-2 py-1 bg-white/20 rounded-full text-[7px] backdrop-blur-sm">
                      {currentContent.cta_text}
                    </div>
                  )}
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

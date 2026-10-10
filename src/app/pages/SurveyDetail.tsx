import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { SurveySectionContainer } from "../components/survey/SurveySectionContainer";
import { SliderPreferenceQuestion } from "../components/survey/SliderPreferenceQuestion";
import { ImageSelectionGrid } from "../components/survey/ImageSelectionGrid";
import { ConditionalFollowUp } from "../components/survey/ConditionalFollowUp";
import { CheckboxListQuestion } from "../components/survey/CheckboxListQuestion";
import { OpenTextQuestion } from "../components/survey/OpenTextQuestion";
import { IllustratedSelectionTiles } from "../components/survey/IllustratedSelectionTiles";
import { saveSurveyResponse, getSurveyResponse } from "../utils/surveyStorage";

export function SurveyDetail() {
  const { surveyId } = useParams();

  // Section 1: Flowers
  const [flowersRating, setFlowersRating] = useState(3);
  const [flowersWhyNot, setFlowersWhyNot] = useState<string[]>([]);
  const [flowersWhyNotOther, setFlowersWhyNotOther] = useState("");
  const [flowerStyles, setFlowerStyles] = useState<string[]>([]);
  const [flowerPreferences, setFlowerPreferences] = useState("");

  // Section 2: Plants
  const [plantsRating, setPlantsRating] = useState(3);
  const [plantsWhyNot, setPlantsWhyNot] = useState<string[]>([]);
  const [plantsWhyNotOther, setPlantsWhyNotOther] = useState("");
  const [plantPersonType, setPlantPersonType] = useState("");
  const [plantTypes, setPlantTypes] = useState<string[]>([]);
  const [plantExtras, setPlantExtras] = useState<string[]>([]);
  const [plantWishlist, setPlantWishlist] = useState("");

  // Section 3: Small Objects
  const [giftsRating, setGiftsRating] = useState(3);
  const [thingsEnjoy, setThingsEnjoy] = useState<string[]>([]);
  const [thingsAvoid, setThingsAvoid] = useState<string[]>([]);
  const [avoidOther, setAvoidOther] = useState("");
  const [thoughtfulGestures, setThoughtfulGestures] = useState("");

  // Save state management
  const [saveState, setSaveState] = useState<"idle" | "saved" | "unsaved">("idle");
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Load saved responses on mount
  useEffect(() => {
    if (!surveyId) return;
    
    const savedData = getSurveyResponse(surveyId);
    if (savedData?.responses) {
      const r = savedData.responses;
      
      // Section 1: Flowers
      if (r.flowersRating !== undefined) setFlowersRating(r.flowersRating);
      if (r.flowersWhyNot) setFlowersWhyNot(r.flowersWhyNot);
      if (r.flowersWhyNotOther) setFlowersWhyNotOther(r.flowersWhyNotOther);
      if (r.flowerStyles) setFlowerStyles(r.flowerStyles);
      if (r.flowerPreferences) setFlowerPreferences(r.flowerPreferences);
      
      // Section 2: Plants
      if (r.plantsRating !== undefined) setPlantsRating(r.plantsRating);
      if (r.plantsWhyNot) setPlantsWhyNot(r.plantsWhyNot);
      if (r.plantsWhyNotOther) setPlantsWhyNotOther(r.plantsWhyNotOther);
      if (r.plantPersonType) setPlantPersonType(r.plantPersonType);
      if (r.plantTypes) setPlantTypes(r.plantTypes);
      if (r.plantExtras) setPlantExtras(r.plantExtras);
      if (r.plantWishlist) setPlantWishlist(r.plantWishlist);
      
      // Section 3: Small Objects
      if (r.giftsRating !== undefined) setGiftsRating(r.giftsRating);
      if (r.thingsEnjoy) setThingsEnjoy(r.thingsEnjoy);
      if (r.thingsAvoid) setThingsAvoid(r.thingsAvoid);
      if (r.avoidOther) setAvoidOther(r.avoidOther);
      if (r.thoughtfulGestures) setThoughtfulGestures(r.thoughtfulGestures);
      
      setSaveState("saved");
    }
  }, [surveyId]);

  // Track changes to mark as unsaved
  useEffect(() => {
    if (saveState === "saved") {
      setSaveState("unsaved");
    }
  }, [
    flowersRating,
    flowersWhyNot,
    flowersWhyNotOther,
    flowerStyles,
    flowerPreferences,
    plantsRating,
    plantsWhyNot,
    plantsWhyNotOther,
    plantPersonType,
    plantTypes,
    plantExtras,
    plantWishlist,
    giftsRating,
    thingsEnjoy,
    thingsAvoid,
    avoidOther,
    thoughtfulGestures,
  ]);

  const sliderOptions = [
    { value: 1, label: "Please don't give me flowers" },
    { value: 2, label: "Usually no" },
    { value: 3, label: "Occasionally" },
    { value: 4, label: "Yes" },
    { value: 5, label: "I love receiving flowers" },
  ];

  const plantsSliderOptions = [
    { value: 1, label: "Please don't give me plants" },
    { value: 2, label: "Rarely" },
    { value: 3, label: "Sometimes" },
    { value: 4, label: "Yes" },
    { value: 5, label: "I love getting plants" },
  ];

  const giftsSliderOptions = [
    { value: 1, label: "Please don't give me things" },
    { value: 2, label: "Rarely" },
    { value: 3, label: "Sometimes" },
    { value: 4, label: "Yes" },
    { value: 5, label: "I love thoughtful little gifts" },
  ];

  const flowerStyleOptions = [
    {
      id: "classic-bouquet",
      label: "Classic bouquet (roses and baby's breath)",
      imageUrl: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop",
    },
    {
      id: "wildflowers",
      label: "Wildflowers / meadow style",
      imageUrl: "https://images.unsplash.com/photo-1463320726281-696a485928c7?w=400&h=400&fit=crop",
    },
    {
      id: "minimal-modern",
      label: "Minimal modern bouquet",
      imageUrl: "https://images.unsplash.com/photo-1487700160041-babef9c3cb55?w=400&h=400&fit=crop",
    },
    {
      id: "single-flower",
      label: "Single-flower bouquets (all tulips, all lilies)",
      imageUrl: "https://images.unsplash.com/photo-1496062031456-07b8f162a322?w=400&h=400&fit=crop",
    },
    {
      id: "dramatic",
      label: "Dramatic or unusual flowers",
      imageUrl: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=400&h=400&fit=crop",
    },
    {
      id: "seasonal",
      label: "Seasonal / locally grown flowers",
      imageUrl: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&h=400&fit=crop",
    },
    {
      id: "hand-picked",
      label: "Hand-picked flowers",
      imageUrl: "https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?w=400&h=400&fit=crop",
    },
  ];

  const plantTypeOptions = [
    {
      id: "pothos",
      label: "Pothos / trailing plants",
      imageUrl: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=400&fit=crop",
    },
    {
      id: "snake-plant",
      label: "Snake plant",
      imageUrl: "https://images.unsplash.com/photo-1593482892290-f54927ae1bb8?w=400&h=400&fit=crop",
    },
    {
      id: "monstera",
      label: "Monstera / statement plants",
      imageUrl: "https://images.unsplash.com/photo-1614594895304-fe7116ac3b58?w=400&h=400&fit=crop",
    },
    {
      id: "herbs",
      label: "Herbs",
      imageUrl: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop",
    },
    {
      id: "succulents",
      label: "Succulents",
      imageUrl: "https://images.unsplash.com/photo-1459156212016-c812468e2115?w=400&h=400&fit=crop",
    },
    {
      id: "propagation",
      label: "Propagation cuttings",
      imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=400&fit=crop",
    },
    {
      id: "outdoor",
      label: "Outdoor plants",
      imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop",
    },
    {
      id: "desk-plants",
      label: "Small desk plants",
      imageUrl: "https://images.unsplash.com/photo-1509937528035-ad76254b0356?w=400&h=400&fit=crop",
    },
  ];

  const handleSave = () => {
    if (!surveyId) return;
    
    const responses = {
      flowersRating,
      flowersWhyNot,
      flowersWhyNotOther,
      flowerStyles,
      flowerPreferences,
      plantsRating,
      plantsWhyNot,
      plantsWhyNotOther,
      plantPersonType,
      plantTypes,
      plantExtras,
      plantWishlist,
      giftsRating,
      thingsEnjoy,
      thingsAvoid,
      avoidOther,
      thoughtfulGestures,
    };
    
    saveSurveyResponse(surveyId, responses);
    setSaveState("saved");
    setShowConfirmation(true);
    
    // Hide confirmation after 3 seconds
    setTimeout(() => {
      setShowConfirmation(false);
    }, 3000);
  };

  const handleCancel = () => {
    if (saveState === "unsaved") {
      setShowConfirmation(true);
    } else {
      window.location.href = "/app/about-me";
    }
  };

  const handleConfirmCancel = () => {
    window.location.href = "/app/about-me";
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Link to="/app/about-me" className="text-gray-600 hover:text-gray-900 mb-6 inline-block">
        ← Back to About Me
      </Link>

      <div className="mb-6">
        <h1 className="mb-2">Flowers, Plants & Objects</h1>
        <p className="text-sm text-gray-600">
          This survey helps you document preferences for flowers, plants, and small decorative objects.
          Your responses will be shared with connections to help them choose thoughtful gifts and gestures.
        </p>
      </div>

      {/* Section 1: Flowers */}
      <SurveySectionContainer title="Flowers">
        <SliderPreferenceQuestion
          question="Do you like receiving flowers?"
          value={flowersRating}
          onChange={setFlowersRating}
          options={sliderOptions}
        />

        <ConditionalFollowUp show={flowersRating <= 2}>
          <CheckboxListQuestion
            question="Why not?"
            options={[
              { id: "allergic", label: "I'm allergic to flowers" },
              { id: "wasteful", label: "I think cut flowers are wasteful" },
              { id: "pets", label: "Pets could get into them" },
              { id: "prefer-plants", label: "I prefer plants instead" },
              { id: "hard-maintain", label: "They're hard to maintain" },
            ]}
            selectedIds={flowersWhyNot}
            onChange={setFlowersWhyNot}
            showOther
            otherText={flowersWhyNotOther}
            onOtherChange={setFlowersWhyNotOther}
          />
        </ConditionalFollowUp>

        <ImageSelectionGrid
          question="What flower styles do you like?"
          options={flowerStyleOptions}
          selectedIds={flowerStyles}
          onChange={setFlowerStyles}
          columns={3}
        />

        <OpenTextQuestion
          question="Flower preferences"
          value={flowerPreferences}
          onChange={setFlowerPreferences}
          placeholder="Favorite flowers, colors, or anything people should know."
          rows={3}
        />
      </SurveySectionContainer>

      {/* Section 2: Plants */}
      <SurveySectionContainer title="Plants">
        <SliderPreferenceQuestion
          question="Do you like receiving houseplants?"
          value={plantsRating}
          onChange={setPlantsRating}
          options={plantsSliderOptions}
        />

        <ConditionalFollowUp show={plantsRating <= 2}>
          <CheckboxListQuestion
            question="Why not?"
            options={[
              { id: "no-light", label: "Not enough light" },
              { id: "travel", label: "I travel too often" },
              { id: "too-many", label: "I already have too many plants" },
              { id: "struggle", label: "I struggle to keep them alive" },
              { id: "pets-eat", label: "Pets might eat them" },
            ]}
            selectedIds={plantsWhyNot}
            onChange={setPlantsWhyNot}
            showOther
            otherText={plantsWhyNotOther}
            onOtherChange={setPlantsWhyNotOther}
          />
        </ConditionalFollowUp>

        <IllustratedSelectionTiles
          question="What kind of plant person are you?"
          options={[
            { id: "beginner", label: "Beginner plant parent", description: "Easy plants only" },
            { id: "casual", label: "Casual plant person", description: "A few plants, moderate care" },
            { id: "enthusiast", label: "Plant enthusiast", description: "I enjoy caring for them" },
            { id: "collector", label: "Plant collector", description: "Rare plants welcome" },
          ]}
          selectedId={plantPersonType}
          onChange={setPlantPersonType}
        />

        <ImageSelectionGrid
          question="Types of plants you'd enjoy receiving"
          options={plantTypeOptions}
          selectedIds={plantTypes}
          onChange={setPlantTypes}
          columns={4}
        />

        <CheckboxListQuestion
          question="Helpful extras"
          options={[
            { id: "include-pot", label: "Include a pot" },
            { id: "no-pot", label: "No pot needed" },
            { id: "care-instructions", label: "Care instructions appreciated" },
            { id: "propagation", label: "Propagation cuttings welcome" },
            { id: "avoid-toxic", label: "Avoid toxic plants for pets" },
          ]}
          selectedIds={plantExtras}
          onChange={setPlantExtras}
        />

        <OpenTextQuestion
          question="Plant wishlist or notes"
          value={plantWishlist}
          onChange={setPlantWishlist}
          placeholder="Any specific plants you'd love to receive or care notes..."
          rows={3}
        />
      </SurveySectionContainer>

      {/* Section 3: Small Objects */}
      <SurveySectionContainer title="Small Objects">
        <p className="text-sm text-gray-600 mb-6">
          These represent casual gifts or tokens people might bring.
        </p>

        <SliderPreferenceQuestion
          question="Do you enjoy small surprise gifts?"
          value={giftsRating}
          onChange={setGiftsRating}
          options={giftsSliderOptions}
        />

        <CheckboxListQuestion
          question="Things you'd enjoy receiving"
          options={[
            { id: "chocolate", label: "Chocolate or sweets" },
            { id: "postcards", label: "Postcards" },
            { id: "letters", label: "Letters" },
            { id: "cards", label: "Birthday cards" },
            { id: "books", label: "Books" },
            { id: "candles", label: "Candles" },
            { id: "socks", label: "Cozy socks" },
            { id: "tea", label: "Tea" },
            { id: "coffee", label: "Coffee" },
            { id: "homemade", label: "Homemade treats" },
          ]}
          selectedIds={thingsEnjoy}
          onChange={setThingsEnjoy}
        />

        <div className="space-y-3">
          <CheckboxListQuestion
            question="Things to avoid"
            options={[
              { id: "avoid-candles", label: "Candles" },
              { id: "avoid-scented", label: "Scented items" },
              { id: "avoid-books", label: "Books" },
              { id: "avoid-food", label: "Food gifts" },
              { id: "avoid-trinkets", label: "Trinkets" },
              { id: "avoid-decorations", label: "Decorations" },
            ]}
            selectedIds={thingsAvoid}
            onChange={setThingsAvoid}
          />
          
          <OpenTextQuestion
            question="Anything you'd rather not receive"
            value={avoidOther}
            onChange={setAvoidOther}
            placeholder="Any specific items or categories to avoid..."
            rows={2}
          />
        </div>

        <OpenTextQuestion
          question="Thoughtful gestures you especially love"
          value={thoughtfulGestures}
          onChange={setThoughtfulGestures}
          placeholder={`e.g., "A handwritten note means a lot to me." or "Wildflowers picked during a walk." or "A simple birthday card."`}
          rows={4}
        />
      </SurveySectionContainer>

      {/* Save Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white py-4">
        <button
          onClick={handleSave}
          className={`px-6 py-2 rounded transition-colors ${
            saveState === "saved"
              ? "bg-green-600 text-white"
              : "bg-black text-white hover:bg-gray-800"
          }`}
        >
          {saveState === "saved" ? "Saved" : saveState === "unsaved" ? "Save Changes" : "Save Survey"}
        </button>
        <Link
          to="/app/about-me"
          className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 inline-block text-center"
        >
          Cancel
        </Link>
        <span className="text-sm text-gray-500 sm:ml-auto self-center text-center sm:text-left">
          {saveState === "unsaved" ? "Changes autosave when you tap Save." : "Changes autosave"}
        </span>
      </div>

      {/* Save Confirmation Message */}
      {showConfirmation && saveState === "saved" && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded shadow-lg">
          Your survey responses have been saved.
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded shadow-lg">
            <h2 className="mb-4">Unsaved Changes</h2>
            <p className="mb-6">You have unsaved changes. Are you sure you want to leave without saving?</p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmCancel}
                className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Leave Without Saving
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
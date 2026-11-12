'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from '@/shared/next-compat/link';
import { useSearchParams, useRouter } from '@/shared/next-compat/navigation';
import { useApp } from '@/shared/context/AppContext.jsx';
import {
    User, Users, Info, Briefcase, GraduationCap, Folder, Code, MessageSquare,
    Edit3, Trash2, Paperclip, ExternalLink, GripVertical, ArrowUp, ArrowDown,
    Sparkles, Check, Globe, Award, Mail, Phone, Calendar, DollarSign, MapPin, X, CheckCircle2, FileText, UserCheck, Video, Search, Share2, Code2, Film, UploadCloud
} from 'lucide-react';
import {
    fetchDriveFiles as apiFetchDriveFiles,
    fetchProfileData as apiFetchProfileData,
    saveProfileData as apiSaveProfileData,
    uploadProfileMedia as apiUploadProfileMedia
} from '@/features/profile/api/profile.api';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import { PageDashboardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/button';

const PROJECT_CATEGORIES = [
    { key: 'commerce', label: 'Commerce' },
    { key: 'erp', label: 'ERP & Operations' },
    { key: 'finance', label: 'Finance' },
    { key: 'profile', label: 'Profile' },
    { key: 'education', label: 'Education' },
    { key: 'booking', label: 'Booking & Services' },
    { key: 'other', label: 'Other Systems' },
];

const CATEGORY_BADGES = {
    commerce: { label: 'Commerce', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    erp: { label: 'ERP & Ops', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    finance: { label: 'Finance', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
    profile: { label: 'Profile', cls: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
    education: { label: 'Education', cls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
    booking: { label: 'Booking', cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
    other: { label: 'Other', cls: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20' },
};

export default function ProfileView({ initialSection }) {
    const { t, activeDashboard, setActiveDashboard } = useApp();
    const router = useRouter();
    const searchParams = useSearchParams();
    const sectionParam = searchParams?.get('section');
    const section = initialSection || sectionParam || 'basic';
    const computedSection = (section && ['basic', 'about', 'experience', 'education', 'projects', 'skills'].includes(section)) ? section : 'basic';

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(computedSection);
    const [prevSection, setPrevSection] = useState(computedSection);
    if (prevSection !== computedSection) {
        setPrevSection(computedSection);
        setActiveTab(computedSection);
    }


    const [driveFiles, setDriveFiles] = useState([]);
    const [loadingDrive, setLoadingDrive] = useState(false);


    const [deleteRequest, setDeleteRequest] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const requestDelete = (action, title) => setDeleteRequest({ action, title });
    const confirmDelete = async () => {
        if (!deleteRequest?.action) return;
        setIsDeleting(true);
        try {
            await deleteRequest.action();
            setDeleteRequest(null);
        } finally {
            setIsDeleting(false);
        }
    };



    const [name, setName] = useState('');
    const [title, setTitle] = useState('');
    const [photo, setPhoto] = useState('');
    const [logo, setLogo] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [github, setGithub] = useState('');
    const [portfolio, setPortfolio] = useState('');
    const [location, setLocation] = useState('');
    const [militaryStatus, setMilitaryStatus] = useState('');
    const [cvUrl, setCvUrl] = useState('');
    const [uploadingCv, setUploadingCv] = useState(false);
    const [savingBasic, setSavingBasic] = useState(false);


    const [sectionsList, setSectionsList] = useState([]);
    const [savingSectionKey, setSavingSectionKey] = useState(null);
    const [sectionFilter, setSectionFilter] = useState('all');
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [uploadingOgImage, setUploadingOgImage] = useState(false);
    const [activeSeoTab, setActiveSeoTab] = useState('/');
    const [activeSnippetTab, setActiveSnippetTab] = useState('core-commerce');
    const [summary, setSummary] = useState('');
    const [savingSummary, setSavingSummary] = useState(false);
    const [whatIDo, setWhatIDo] = useState([]);
    const [newWhatItem, setNewWhatItem] = useState('');
    const [coreExpertise, setCoreExpertise] = useState([]);
    const [newCoreTitle, setNewCoreTitle] = useState('');
    const [newCoreDesc, setNewCoreDesc] = useState('');


    const [experiences, setExperiences] = useState([]);
    const [expCompany, setExpCompany] = useState('');
    const [expRole, setExpRole] = useState('');
    const [expDuration, setExpDuration] = useState('');
    const [expLogo, setExpLogo] = useState('');
    const [expLink, setExpLink] = useState('');
    const [expDesc, setExpDesc] = useState('');
    const [savingExp, setSavingExp] = useState(false);


    const [isEditExpOpen, setIsEditExpOpen] = useState(false);
    const [editExpIndex, setEditExpIndex] = useState(null);
    const [editExpCompany, setEditExpCompany] = useState('');
    const [editExpRole, setEditExpRole] = useState('');
    const [editExpDuration, setEditExpDuration] = useState('');
    const [editExpLogo, setEditExpLogo] = useState('');
    const [editExpLink, setEditExpLink] = useState('');
    const [editExpDesc, setEditExpDesc] = useState('');


    const [educationList, setEducationList] = useState([]);
    const [certList, setCertList] = useState([]);
    const [eduDegree, setEduDegree] = useState('');
    const [eduInstitution, setEduInstitution] = useState('');
    const [eduYear, setEduYear] = useState('');
    const [eduGrade, setEduGrade] = useState('');
    const [eduDesc, setEduDesc] = useState('');
    const [savingEdu, setSavingEdu] = useState(false);

    const [certName, setCertName] = useState('');
    const [certInst, setCertInst] = useState('');
    const [certDate, setCertDate] = useState('');


    const [isEditEduOpen, setIsEditEduOpen] = useState(false);
    const [editEduIndex, setEditEduIndex] = useState(null);
    const [editEduDegree, setEditEduDegree] = useState('');
    const [editEduInstitution, setEditEduInstitution] = useState('');
    const [editEduYear, setEditEduYear] = useState('');
    const [editEduGrade, setEditEduGrade] = useState('');
    const [editEduDesc, setEditEduDesc] = useState('');


    const [isEditCertOpen, setIsEditCertOpen] = useState(false);
    const [editCertIndex, setEditCertIndex] = useState(null);
    const [editCertName, setEditCertName] = useState('');
    const [editCertInst, setEditCertInst] = useState('');
    const [editCertDate, setEditCertDate] = useState('');


    const [projectsList, setProjectsList] = useState([]);
    const [projName, setProjName] = useState('');
    const [projCompany, setProjCompany] = useState('');
    const [projRole, setProjRole] = useState('');
    const [projLink, setProjLink] = useState('');
    const [projDesc, setProjDesc] = useState('');
    const [projLogo, setProjLogo] = useState('');
    const [projCategory, setProjCategory] = useState('commerce');
    const [projCountry, setProjCountry] = useState('Egypt');
    const [projLat, setProjLat] = useState('30.0444');
    const [projLng, setProjLng] = useState('31.2357');

    const companyOptions = Array.from(new Set([
        'Freelance',
        'MitchDesigns',
        'Etolv ERP',
        'OnCreation',
        ...experiences.map(e => e.company).filter(Boolean)
    ]));
    const [savingProj, setSavingProj] = useState(false);


    const [draggedProjIdx, setDraggedProjIdx] = useState(null);
    const [dragOverProjIdx, setDragOverProjIdx] = useState(null);
    const [savingProjectsOrder, setSavingProjectsOrder] = useState(false);
    const [projectsOrderSavedNotice, setProjectsOrderSavedNotice] = useState(false);


    const [isEditProjOpen, setIsEditProjOpen] = useState(false);
    const [editProjIndex, setEditProjIndex] = useState(null);
    const [editProjName, setEditProjName] = useState('');
    const [editProjCompany, setEditProjCompany] = useState('');
    const [editProjRole, setEditProjRole] = useState('');
    const [editProjLink, setEditProjLink] = useState('');
    const [editProjDesc, setEditProjDesc] = useState('');
    const [editProjLogo, setEditProjLogo] = useState('');
    const [editProjCategory, setEditProjCategory] = useState('commerce');
    const [editProjCountry, setEditProjCountry] = useState('');
    const [editProjLat, setEditProjLat] = useState('');
    const [editProjLng, setEditProjLng] = useState('');


    const [skillsByCategory, setSkillsByCategory] = useState({});
    const [skillCat, setSkillCat] = useState('Backend Development');
    const [customSkillCat, setCustomSkillCat] = useState('');
    const [isAddingCustomCat, setIsAddingCustomCat] = useState(false);
    const [skillName, setSkillName] = useState('');
    const [skillLevel, setSkillLevel] = useState('Advanced');
    const [skillHighlight, setSkillHighlight] = useState(false);
    const [savingSkill, setSavingSkill] = useState(false);


    const [isEditSkillOpen, setIsEditSkillOpen] = useState(false);
    const [editSkillCat, setEditSkillCat] = useState('');
    const [editSkillIndex, setEditSkillIndex] = useState(null);
    const [editSkillName, setEditSkillName] = useState('');
    const [editSkillLevel, setEditSkillLevel] = useState('Advanced');
    const [editSkillHighlight, setEditSkillHighlight] = useState(false);

    const applyProfilePayload = useCallback((payload) => {
        if (!payload) return;
        setData(payload);
        const personal = payload.personalInfo || payload.personal || {};
        const contact = personal.contact || personal;
        setName(personal.name || '');
        setTitle(personal.title || '');
        setPhoto(personal.photo || personal.photo_path || '');
        const rawLogo = personal.logo || personal.logo_path || '';
        setLogo(rawLogo && !rawLogo.includes('image1') ? rawLogo : '/logo-mark.svg');
        setPhone(contact.phone || personal.phone || '');
        setEmail(contact.email || personal.email || '');
        setLinkedin(contact.linkedin || personal.linkedin_url || personal.linkedin || '');
        setGithub(contact.github || personal.github_url || personal.github || '');
        setPortfolio(contact.portfolio || personal.portfolio_url || personal.portfolio || '');
        setLocation(personal.location || '');
        setMilitaryStatus(personal.militaryStatus || personal.military_status || '');
        setCvUrl(personal.cv_url || personal.cv || contact.cv_url || '');

        const secs = payload.sections || {};
        setSectionsList(Object.values(secs));

        const about = payload.aboutData || payload.about || {};
        setSummary(about.summary || '');
        setWhatIDo(about.whatIDo || about.what_i_do || []);
        setCoreExpertise(Array.isArray(about.coreExpertise || about.core_expertise) ? (about.coreExpertise || about.core_expertise) : []);

        const exp = payload.experienceData?.experiences || payload.experience || [];
        setExperiences(Array.isArray(exp) ? exp : []);

        const edu = payload.educationData?.education || payload.education || [];
        setEducationList(Array.isArray(edu) ? edu : []);

        const certs = payload.educationData?.certificates || payload.certificates || [];
        setCertList(Array.isArray(certs) ? certs : []);

        const projs = payload.projectsData?.projects || payload.projects || [];
        setProjectsList(Array.isArray(projs) ? projs : []);

        const skills = payload.skillsData?.skillsByCategory || payload.skills?.skillsByCategory || payload.skillsByCategory || {};
        setSkillsByCategory(skills || {});
    }, []);

    const fetchDriveFiles = useCallback(() => {
        setLoadingDrive(true);
        apiFetchDriveFiles()
            .then(files => {
                setDriveFiles(files);
                setLoadingDrive(false);
            })
            .catch(() => setLoadingDrive(false));
    }, []);

    const loadProfile = useCallback(() => {
        setLoading(true);
        apiFetchProfileData()
            .then(payload => {
                applyProfilePayload(payload);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load profile details", err);
                setLoading(false);
            });
    }, [applyProfilePayload]);

    useEffect(() => {
        setActiveDashboard('profile');
        apiFetchProfileData()
            .then(payload => {
                applyProfilePayload(payload);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load profile details", err);
                setLoading(false);
            });
        apiFetchDriveFiles()
            .then(files => {
                setDriveFiles(files);
                setLoadingDrive(false);
            })
            .catch(() => setLoadingDrive(false));
    }, [setActiveDashboard, applyProfilePayload]);

    const triggerSave = async (payload) => {
        try {
            const resData = await apiSaveProfileData(payload);
            if (resData.success) {
                loadProfile();
                return true;
            }
        } catch (e) {
            console.error("Save error:", e);
        }
        return false;
    };

    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingPhoto(true);
        try {
            const data = await apiUploadProfileMedia(file, 'Profile_Photo');
            if (data.success && data.filePath) {
                setPhoto(data.filePath);
                await triggerSave({
                    action: 'save_personal',
                    name, title, photo: data.filePath, logo, cv_url: cvUrl, phone, email, linkedin, github, portfolio, location, militaryStatus
                });
            }
        } catch (err) {
            console.error('Failed to upload profile photo:', err);
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingLogo(true);
        try {
            const data = await apiUploadProfileMedia(file, 'Brand_Logo');
            if (data.success && data.filePath) {
                setLogo(data.filePath);
                await triggerSave({
                    action: 'save_personal',
                    name, title, photo, logo: data.filePath, cv_url: cvUrl, phone, email, linkedin, github, portfolio, location, militaryStatus
                });
            }
        } catch (err) {
            console.error('Failed to upload brand logo:', err);
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleCvUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingCv(true);
        try {
            const data = await apiUploadProfileMedia(file, 'Profile_CV');
            if (data.success && data.filePath) {
                setCvUrl(data.filePath);
                await triggerSave({
                    action: 'save_personal',
                    name, title, photo, logo, cv_url: data.filePath, phone, email, linkedin, github, portfolio, location, militaryStatus
                });
            }
        } catch (err) {
            console.error('Failed to upload CV:', err);
        } finally {
            setUploadingCv(false);
        }
    };

    const handleSavePersonal = async (e) => {
        e.preventDefault();
        setSavingBasic(true);
        await triggerSave({
            action: 'save_personal',
            name, title, photo, logo, cv_url: cvUrl, phone, email, linkedin, github, portfolio, location, militaryStatus
        });
        setSavingBasic(false);
    };


    const handleUpdateSectionField = (secKey, field, val) => {
        setSectionsList(prev => prev.map(s => s.section_key === secKey ? { ...s, [field]: val } : s));
    };

    const handleSaveSection = async (sec) => {
        setSavingSectionKey(sec.section_key);
        try {
            await triggerSave({
                action: 'save_section',
                section: sec
            });
        } finally {
            setSavingSectionKey(null);
        }
    };

    const handleVideoUpload = async (e, secKey) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingVideo(true);
        try {
            const uploadRes = await apiUploadProfileMedia(file, 'Hero_Video');
            if (uploadRes.success && (uploadRes.url || uploadRes.filePath)) {
                const rawUrl = uploadRes.url || uploadRes.filePath;
                const videoUrl = resolveStreamableVideoUrl(rawUrl);
                const sec = sectionsList.find(s => s.section_key === secKey);
                const currentMeta = sec?.meta && typeof sec.meta === 'object' ? sec.meta : {};
                const updatedMeta = { ...currentMeta, video_url: videoUrl };
                handleUpdateSectionField(secKey, 'meta', updatedMeta);
                await triggerSave({
                    action: 'save_section',
                    section: { ...sec, meta: updatedMeta }
                });
            }
        } catch (err) {
            console.error('Failed to upload video:', err);
        } finally {
            setUploadingVideo(false);
        }
    };

    const handleOgImageUpload = async (e, routeKey) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingOgImage(true);
        try {
            const uploadRes = await apiUploadProfileMedia(file, 'SEO_OG_Banner');
            if (uploadRes.success && (uploadRes.url || uploadRes.filePath)) {
                const imgUrl = uploadRes.url || uploadRes.filePath;
                const sec = sectionsList.find(s => s.section_key === 'seo_meta');
                const existingMeta = sec?.meta && typeof sec.meta === 'object' ? { ...sec.meta } : {};
                const routeMeta = { ...(existingMeta[routeKey] || {}), ogImage: imgUrl };
                existingMeta[routeKey] = routeMeta;
                handleUpdateSectionField('seo_meta', 'meta', existingMeta);
                await triggerSave({
                    action: 'save_section',
                    section: { ...sec, meta: existingMeta }
                });
            }
        } catch (err) {
            console.error('Failed to upload OG image:', err);
        } finally {
            setUploadingOgImage(false);
        }
    };

    const handleSaveAbout = async (e) => {
        e.preventDefault();
        setSavingSummary(true);
        await triggerSave({
            action: 'save_about',
            aboutData: { summary, whatIDo, coreExpertise }
        });
        setSavingSummary(false);
    };

    const handleAddWhatIDo = (e) => {
        e.preventDefault();
        if (!newWhatItem.trim()) return;
        const updated = [...whatIDo, newWhatItem.trim()];
        setWhatIDo(updated);
        setNewWhatItem('');
        triggerSave({ action: 'save_about', aboutData: { summary, whatIDo: updated, coreExpertise } });
    };

    const handleDeleteWhatIDo = (index) => {
        const updated = whatIDo.filter((_, i) => i !== index);
        setWhatIDo(updated);
        triggerSave({ action: 'save_about', aboutData: { summary, whatIDo: updated, coreExpertise } });
    };

    const handleAddCoreExpertise = (e) => {
        e.preventDefault();
        if (!newCoreTitle.trim()) return;
        const updated = [...coreExpertise, { title: newCoreTitle.trim(), description: newCoreDesc.trim() }];
        setCoreExpertise(updated);
        setNewCoreTitle('');
        setNewCoreDesc('');
        triggerSave({ action: 'save_about', aboutData: { summary, whatIDo, coreExpertise: updated } });
    };

    const handleDeleteCoreExpertise = (index) => {
        const updated = coreExpertise.filter((_, i) => i !== index);
        setCoreExpertise(updated);
        triggerSave({ action: 'save_about', aboutData: { summary, whatIDo, coreExpertise: updated } });
    };


    const handleAddExperience = async (e) => {
        e.preventDefault();
        if (!expCompany.trim() || !expRole.trim()) return;
        setSavingExp(true);
        const updatedExp = [
            {
                company: expCompany,
                role: expRole,
                duration: expDuration,
                logo: expLogo || 'https://lh3.googleusercontent.com/d/1D5C7mc5QEqCKHqLJVQRrOF7xr0rEGhSt',
                link: expLink || '',
                description: expDesc || ''
            },
            ...experiences
        ];
        setExperiences(updatedExp);
        await triggerSave({ action: 'save_experience', experienceData: { experiences: updatedExp } });
        setExpCompany(''); setExpRole(''); setExpDuration(''); setExpLogo(''); setExpLink(''); setExpDesc('');
        setSavingExp(false);
    };

    const handleOpenEditExp = (exp, idx) => {
        setEditExpIndex(idx);
        setEditExpCompany(exp.company || '');
        setEditExpRole(exp.role || '');
        setEditExpDuration(exp.duration || '');
        setEditExpLogo(exp.logo || '');
        setEditExpLink(exp.link || '');
        setEditExpDesc(exp.description || '');
        setIsEditExpOpen(true);
    };

    const handleUpdateExperience = async (e) => {
        e.preventDefault();
        if (editExpIndex === null) return;
        const updatedExp = [...experiences];
        updatedExp[editExpIndex] = {
            ...updatedExp[editExpIndex],
            company: editExpCompany,
            role: editExpRole,
            duration: editExpDuration,
            logo: editExpLogo,
            link: editExpLink,
            description: editExpDesc
        };
        setExperiences(updatedExp);
        await triggerSave({ action: 'save_experience', experienceData: { experiences: updatedExp } });
        setIsEditExpOpen(false);
    };

    const handleDeleteExperience = async (index) => {
        const updatedExp = experiences.filter((_, i) => i !== index);
        setExperiences(updatedExp);
        await triggerSave({ action: 'save_experience', experienceData: { experiences: updatedExp } });
    };


    const handleAddEducation = async (e) => {
        e.preventDefault();
        if (!eduDegree.trim() || !eduInstitution.trim()) return;
        setSavingEdu(true);
        const updatedEdu = [{ degree: eduDegree, institution: eduInstitution, year: eduYear, grade: eduGrade, description: eduDesc }, ...educationList];
        setEducationList(updatedEdu);
        await triggerSave({ action: 'save_education', educationData: { education: updatedEdu, certificates: certList } });
        setEduDegree(''); setEduInstitution(''); setEduYear(''); setEduGrade(''); setEduDesc('');
        setSavingEdu(false);
    };

    const handleOpenEditEdu = (edu, idx) => {
        setEditEduIndex(idx);
        setEditEduDegree(edu.degree || '');
        setEditEduInstitution(edu.institution || '');
        setEditEduYear(edu.year || '');
        setEditEduGrade(edu.grade || '');
        setEditEduDesc(edu.description || '');
        setIsEditEduOpen(true);
    };

    const handleUpdateEducation = async (e) => {
        e.preventDefault();
        if (editEduIndex === null) return;
        const updatedEdu = [...educationList];
        updatedEdu[editEduIndex] = {
            ...updatedEdu[editEduIndex],
            degree: editEduDegree,
            institution: editEduInstitution,
            year: editEduYear,
            grade: editEduGrade,
            description: editEduDesc
        };
        setEducationList(updatedEdu);
        await triggerSave({ action: 'save_education', educationData: { education: updatedEdu, certificates: certList } });
        setIsEditEduOpen(false);
    };

    const handleDeleteEducation = async (index) => {
        const updatedEdu = educationList.filter((_, i) => i !== index);
        setEducationList(updatedEdu);
        await triggerSave({ action: 'save_education', educationData: { education: updatedEdu, certificates: certList } });
    };

    const handleAddCertificate = async (e) => {
        e.preventDefault();
        if (!certName.trim()) return;
        const updatedCert = [{ name: certName, institution: certInst, date: certDate }, ...certList];
        setCertList(updatedCert);
        await triggerSave({ action: 'save_education', educationData: { education: educationList, certificates: updatedCert } });
        setCertName(''); setCertInst(''); setCertDate('');
    };

    const handleOpenEditCert = (c, idx) => {
        setEditCertIndex(idx);
        setEditCertName(c.name || '');
        setEditCertInst(c.institution || '');
        setEditCertDate(c.date || '');
        setIsEditCertOpen(true);
    };

    const handleUpdateCert = async (e) => {
        e.preventDefault();
        if (editCertIndex === null) return;
        const updatedCert = [...certList];
        updatedCert[editCertIndex] = { name: editCertName, institution: editCertInst, date: editCertDate };
        setCertList(updatedCert);
        await triggerSave({ action: 'save_education', educationData: { education: educationList, certificates: updatedCert } });
        setIsEditCertOpen(false);
    };

    const handleDeleteCertificate = async (index) => {
        const updatedCert = certList.filter((_, i) => i !== index);
        setCertList(updatedCert);
        await triggerSave({ action: 'save_education', educationData: { education: educationList, certificates: updatedCert } });
    };




    const SKILL_LEVEL_CONFIG = {
        Beginner: {
            value: 'Beginner',
            en: 'Beginner',
            ar: 'مبتدئ',
            icon: '🌱',
            badgeBg: 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
            rating: 1
        },
        Intermediate: {
            value: 'Intermediate',
            en: 'Intermediate',
            ar: 'متوسط',
            icon: '⚡',
            badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            rating: 2
        },
        Advanced: {
            value: 'Advanced',
            en: 'Advanced',
            ar: 'متقدم',
            icon: '🚀',
            badgeBg: 'bg-[#BC5C29]/10 text-[#BC5C29] dark:text-[#BC5C29] border-[#BC5C29]/20',
            rating: 3
        },
        Expert: {
            value: 'Expert',
            en: 'Expert',
            ar: 'محترف',
            icon: '👑',
            badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25 font-black',
            rating: 5
        }
    };

    const resolveSkillLevel = (badge, rating) => {
        if (badge) {
            const b = String(badge).toLowerCase();
            if (b.includes('expert') || b.includes('محترف') || b.includes('master') || b.includes('خبير')) return SKILL_LEVEL_CONFIG.Expert;
            if (b.includes('advanc') || b.includes('متقدم') || b.includes('senior')) return SKILL_LEVEL_CONFIG.Advanced;
            if (b.includes('intermed') || b.includes('متوسط') || b.includes('mid')) return SKILL_LEVEL_CONFIG.Intermediate;
            if (b.includes('begin') || b.includes('مبتدئ') || b.includes('junior')) return SKILL_LEVEL_CONFIG.Beginner;
        }
        if (rating === 1) return SKILL_LEVEL_CONFIG.Beginner;
        if (rating === 2) return SKILL_LEVEL_CONFIG.Intermediate;
        if (rating === 3) return SKILL_LEVEL_CONFIG.Advanced;
        if (rating >= 4) return SKILL_LEVEL_CONFIG.Expert;
        return SKILL_LEVEL_CONFIG.Advanced;
    };

    const getCategorySortWeight = (catName) => {
        const l = String(catName || '').toLowerCase();
        if (l.includes('back-end') || l.includes('backend')) return 1;
        if (l.includes('front-end') || l.includes('frontend')) return 2;
        if (l.includes('database') || l.includes('storage') || l.includes('sql') || l.includes('mongo')) return 3;
        if (l.includes('devops') || l.includes('infrastructure') || l.includes('linux') || l.includes('cloud')) return 4;
        if (l.includes('commerce') || l.includes('cms')) return 5;
        if (l.includes('architecture') || l.includes('engineer')) return 6;
        return 10;
    };


    const handleReorderProjects = async (fromIndex, toIndex) => {
        if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= projectsList.length || toIndex >= projectsList.length) return;
        const updated = [...projectsList];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        const reindexed = updated.map((p, i) => ({ ...p, sort_order: i }));
        setProjectsList(reindexed);
        setSavingProjectsOrder(true);
        try {
            await triggerSave({ action: 'save_projects', projectsData: { projects: reindexed } });
            setProjectsOrderSavedNotice(true);
            setTimeout(() => setProjectsOrderSavedNotice(false), 2500);
        } finally {
            setSavingProjectsOrder(false);
        }
    };

    const handleMoveProject = async (index, direction) => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= projectsList.length) return;
        await handleReorderProjects(index, targetIndex);
    };

    const handleCompanyChangeForAdd = (val) => {
        setProjCompany(val);
        if (val.toLowerCase().includes('freelance')) {
            setProjLogo(logo || 'https://lh3.googleusercontent.com/d/1ytPSpL2XoF0HsGudg4qzen2GRaofBJi7');
        } else {
            const exp = experiences.find(e => e.company?.toLowerCase() === val.toLowerCase());
            if (exp?.logo) {
                setProjLogo(exp.logo);
            }
        }
    };

    const handleCompanyChangeForEdit = (val) => {
        setEditProjCompany(val);
        if (val.toLowerCase().includes('freelance')) {
            setEditProjLogo(logo || 'https://lh3.googleusercontent.com/d/1ytPSpL2XoF0HsGudg4qzen2GRaofBJi7');
        } else {
            const exp = experiences.find(e => e.company?.toLowerCase() === val.toLowerCase());
            if (exp?.logo) {
                setEditProjLogo(exp.logo);
            }
        }
    };

    const handleAddProject = async (e) => {
        e.preventDefault();
        if (!projName.trim()) return;
        setSavingProj(true);
        const latVal = projLat ? parseFloat(projLat) : null;
        const lngVal = projLng ? parseFloat(projLng) : null;
        const newProject = {
            name: projName,
            link: projLink,
            description: projDesc,
            role: projRole || 'Back-End Developer',
            company: projCompany || 'MitchDesigns',
            logo: projLogo || '',
            category: projCategory || 'commerce',
            country: projCountry || 'Egypt',
            coordinates: (latVal && lngVal) ? { lat: latVal, lng: lngVal } : null,
            sort_order: projectsList.length
        };
        const updatedProj = [...projectsList, newProject].map((p, i) => ({ ...p, sort_order: i }));
        setProjectsList(updatedProj);
        await triggerSave({ action: 'save_projects', projectsData: { projects: updatedProj } });
        setProjName(''); setProjCompany(''); setProjRole(''); setProjLink(''); setProjDesc(''); setProjLogo(''); setProjCategory('commerce');
        setSavingProj(false);
    };

    const handleOpenEditProj = (p, idx) => {
        setEditProjIndex(idx);
        setEditProjName(p.name || '');
        setEditProjCompany(p.company || '');
        setEditProjRole(p.role || '');
        setEditProjLink(p.link || '');
        setEditProjDesc(p.description || '');
        setEditProjLogo(p.logo || '');
        setEditProjCategory(p.category || 'other');
        setEditProjCountry(p.country || '');
        setEditProjLat(p.coordinates?.lat ? String(p.coordinates.lat) : '');
        setEditProjLng(p.coordinates?.lng ? String(p.coordinates.lng) : '');
        setIsEditProjOpen(true);
    };

    const handleUpdateProject = async (e) => {
        e.preventDefault();
        if (editProjIndex === null) return;
        const latVal = editProjLat ? parseFloat(editProjLat) : null;
        const lngVal = editProjLng ? parseFloat(editProjLng) : null;
        const updatedProj = [...projectsList];
        const existingOrder = projectsList[editProjIndex]?.sort_order !== undefined ? projectsList[editProjIndex].sort_order : editProjIndex;
        updatedProj[editProjIndex] = {
            name: editProjName,
            company: editProjCompany,
            role: editProjRole,
            link: editProjLink,
            description: editProjDesc,
            logo: editProjLogo || '',
            category: editProjCategory || 'other',
            country: editProjCountry || '',
            coordinates: (latVal && lngVal) ? { lat: latVal, lng: lngVal } : null,
            sort_order: existingOrder
        };
        setProjectsList(updatedProj);
        await triggerSave({ action: 'save_projects', projectsData: { projects: updatedProj } });
        setIsEditProjOpen(false);
    };

    const handleDeleteProject = async (index) => {
        const updatedProj = projectsList.filter((_, i) => i !== index).map((p, i) => ({ ...p, sort_order: i }));
        setProjectsList(updatedProj);
        await triggerSave({ action: 'save_projects', projectsData: { projects: updatedProj } });
    };


    const handleAddSkill = async (e) => {
        e.preventDefault();
        if (!skillName.trim()) return;
        setSavingSkill(true);
        const targetCat = (isAddingCustomCat && customSkillCat.trim()) ? customSkillCat.trim() : skillCat;
        const updatedSkills = { ...skillsByCategory };
        if (!updatedSkills[targetCat]) updatedSkills[targetCat] = [];

        const selectedConfig = SKILL_LEVEL_CONFIG[skillLevel] || SKILL_LEVEL_CONFIG.Advanced;
        updatedSkills[targetCat].push({
            name: skillName.trim(),
            skill: skillName.trim(),
            badge: selectedConfig.value,
            highlight: skillHighlight,
            rating: selectedConfig.rating
        });
        setSkillsByCategory(updatedSkills);
        await triggerSave({ action: 'save_skills', skillsData: { skillsByCategory: updatedSkills } });
        setSkillName('');
        setSkillHighlight(false);
        if (isAddingCustomCat) {
            setCustomSkillCat('');
            setIsAddingCustomCat(false);
        }
        setSavingSkill(false);
    };

    const handleOpenEditSkill = (cat, s, sIdx) => {
        setEditSkillCat(cat);
        setEditSkillIndex(sIdx);
        setEditSkillName(s.skill || s.name || '');
        const currentLevel = resolveSkillLevel(s.badge, s.rating);
        setEditSkillLevel(currentLevel.value);
        setEditSkillHighlight(Boolean(s.highlight || s.is_highlight));
        setIsEditSkillOpen(true);
    };

    const handleUpdateSkill = async (e) => {
        e.preventDefault();
        if (editSkillIndex === null || !editSkillCat) return;
        const updatedSkills = { ...skillsByCategory };
        const selectedConfig = SKILL_LEVEL_CONFIG[editSkillLevel] || SKILL_LEVEL_CONFIG.Advanced;
        if (updatedSkills[editSkillCat]) {
            updatedSkills[editSkillCat][editSkillIndex] = {
                name: editSkillName.trim(),
                skill: editSkillName.trim(),
                badge: selectedConfig.value,
                highlight: editSkillHighlight,
                rating: selectedConfig.rating
            };
        }
        setSkillsByCategory(updatedSkills);
        await triggerSave({ action: 'save_skills', skillsData: { skillsByCategory: updatedSkills } });
        setIsEditSkillOpen(false);
    };

    const handleDeleteSkill = async (cat, index) => {
        const updatedSkills = { ...skillsByCategory };
        if (updatedSkills[cat]) {
            updatedSkills[cat] = updatedSkills[cat].filter((_, i) => i !== index);
        }
        setSkillsByCategory(updatedSkills);
        await triggerSave({ action: 'save_skills', skillsData: { skillsByCategory: updatedSkills } });
    };



    const totalSkillsCount = Object.values(skillsByCategory || {}).reduce(
        (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
        0
    );

    useEffect(() => {
        if (!data) return;
        queueMicrotask(() => {
            try {
                const rawDraft = sessionStorage.getItem('orbit_profile_draft');
                if (rawDraft) {
                    const parsed = JSON.parse(rawDraft);
                    if (parsed.name !== undefined) setName(parsed.name);
                    if (parsed.title !== undefined) setTitle(parsed.title);
                    if (parsed.phone !== undefined) setPhone(parsed.phone);
                    if (parsed.email !== undefined) setEmail(parsed.email);
                    if (parsed.location !== undefined) setLocation(parsed.location);
                    if (parsed.summary !== undefined) setSummary(parsed.summary);
                }
            } catch (_) { }
        });
    }, [data]);

    useEffect(() => {
        if (!data) return;
        try {
            sessionStorage.setItem(
                'orbit_profile_draft',
                JSON.stringify({ name, title, phone, email, location, summary })
            );
        } catch (_) { }
    }, [data, name, title, phone, email, location, summary]);

    if (loading && !data) {
        return <PageDashboardSkeleton kpiCount={4} />;
    }

    return (
        <div className="space-y-6 animate-fade-in pb-24 w-full">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-6">
                <div>
                    <h1 className="orbit-h1 text-[28px] leading-[34px] lg:text-[32px] lg:leading-[38px] font-extrabold text-zinc-900 dark:text-white leading-tight flex items-center gap-2.5">
                        <User size={24} className="text-[#BC5C29]" strokeWidth={2.25} />
                        <span>{t("Profile Dashboard & CV Control", "داشبورد البروفايل والسيرة الذاتية")}</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-normal">
                        {t("Full edit control for personal info, work experience, education, projects, and technical skills.", "إمكانية التعديل الشامل للبيانات الشخصية، الخبرات المهنية، التعليم، ومعرض المشاريع والمهارات.")}
                    </p>
                </div>
                {cvUrl && (
                    <Button variant="default" size="default" asChild className="cursor-pointer self-start sm:self-auto">
                        <a href={cvUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span>{t("Preview Live CV", "معاينة السيرة الذاتية")}</span>
                        </a>
                    </Button>
                )}
            </div>

            {/* Live Profile & CV Summary Preview Card */}
            <div className="p-4 sm:p-5 rounded-xl border border-[#E5E7EB] dark:border-zinc-800 bg-white dark:bg-[#1A1A1A] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#BC5C29]/30 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 font-bold text-[#BC5C29]">
                        {photo ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={photo.includes('drive.google.com/file/d/')
                                    ? `https://lh3.googleusercontent.com/d/${photo.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] || ''}`
                                    : photo}
                                alt={name || 'Profile'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span>{(name || 'Y').slice(0, 1)}</span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white truncate">
                                {name || t("Your Name", "الاسم الكامل")}
                            </h2>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                ● {t("Live Preview", "معاينة حية")}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            {title || t("Software Engineer", "المسمى الوظيفي")} {location ? `· ${location}` : ''}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 sm:flex sm:items-center sm:gap-3 shrink-0">
                    <div className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-[#E5E7EB] dark:border-zinc-800 text-center">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase block">{t("Experience", "الخبرات")}</span>
                        <span className="text-sm font-black font-mono text-zinc-900 dark:text-white">{experiences.length}</span>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-[#E5E7EB] dark:border-zinc-800 text-center">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase block">{t("Projects", "المشاريع")}</span>
                        <span className="text-sm font-black font-mono text-[#BC5C29]">{projectsList.length}</span>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-[#E5E7EB] dark:border-zinc-800 text-center">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase block">{t("Skills", "المهارات")}</span>
                        <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">{totalSkillsCount}</span>
                    </div>
                </div>
            </div>

            {activeTab === 'basic' && (
                <div className="bg-white dark:bg-[#1A1A1A] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs space-y-6">
                    <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        Personal Details &amp; Contact Links
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4 p-4.5 rounded-2xl bg-[#FAF4EF]/50 dark:bg-[#2E0025]/40 border border-[#BC5C29]/25 dark:border-[#BC5C29]/25 shadow-xs transition min-w-0">
                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#BC5C29]/30 dark:border-[#BC5C29]/40 bg-[#FAF4EF] dark:bg-[#2E0025] shrink-0 shadow-sm flex items-center justify-center p-1">
                                {photo ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={photo.includes('drive.google.com/file/d/')
                                            ? `https://lh3.googleusercontent.com/d/${photo.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] || ''}`
                                            : photo}
                                        alt="Profile Photo"
                                        className="w-full h-full object-cover rounded-xl"
                                        onError={(e) => {
                                            const driveId = photo.match(/d\/([a-zA-Z0-9_-]+)/)?.[1];
                                            if (driveId && !e.target.src.includes('thumbnail')) {
                                                e.target.src = `https://drive.google.com/thumbnail?id=${driveId}&sz=w400`;
                                            } else {
                                                e.target.style.display = 'none';
                                            }
                                        }}
                                    />
                                ) : (
                                    <span className="text-2xl font-bold text-zinc-400">👤</span>
                                )}
                            </div>
                            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-[#2B2320] dark:text-[#FBF3E9] uppercase tracking-wide">Profile Avatar Photo</h4>
                                <p className="text-[10px] text-[#6E5A4E] dark:text-[#D1C5BC]">
                                    Live preview of your avatar. Upload a new photo or select from Drive.
                                </p>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                                    <label className="bg-[#2E0025] text-[#FBF3E9] hover:bg-[#2E0025]/90 dark:bg-[#FAF4EF] dark:text-[#2B2320] px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition inline-flex items-center gap-1.5 shadow-xs">
                                        <span>📷</span> <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                                        <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} className="hidden" />
                                    </label>
                                    {driveFiles.length > 0 && (
                                        <div className="relative max-w-[130px] sm:max-w-[160px]">
                                            <select
                                                onChange={e => {
                                                    if (e.target.value) {
                                                        setPhoto(e.target.value);
                                                        triggerSave({ action: 'save_personal', name, title, photo: e.target.value, logo, cv_url: cvUrl, phone, email, linkedin, github, portfolio, location, militaryStatus });
                                                    }
                                                }}
                                                className="w-full truncate bg-white dark:bg-[#2E0025] border border-[#BC5C29]/25 dark:border-[#BC5C29]/25 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-[#2B2320] dark:text-[#FBF3E9] outline-none cursor-pointer"
                                            >
                                                <option value="">-- Drive --</option>
                                                {driveFiles.map(f => (
                                                    <option key={f.id} value={f.thumbnailUrl}>
                                                        {f.name.length > 22 ? f.name.slice(0, 20) + '...' : f.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 p-4.5 rounded-2xl bg-[#FAF4EF]/50 dark:bg-[#2E0025]/40 border border-[#BC5C29]/25 dark:border-[#BC5C29]/25 shadow-xs transition min-w-0">
                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#BC5C29]/30 dark:border-[#BC5C29]/40 bg-[#FAF4EF] dark:bg-[#2E0025] shrink-0 shadow-sm flex items-center justify-center p-1.5">
                                <img
                                    src={logo && !logo.includes('image1') ? logo : '/logo-mark.svg'}
                                    alt="Brand Logo"
                                    className="w-full h-full object-contain"
                                    onError={(e) => { e.target.src = '/logo-mark.svg'; }}
                                />
                            </div>
                            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-xs font-bold text-[#2B2320] dark:text-[#FBF3E9] uppercase tracking-wide">Brand / Company Logo</h4>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLogo('/logo-mark.svg');
                                            triggerSave({ action: 'save_personal', name, title, photo, logo: '/logo-mark.svg', cv_url: cvUrl, phone, email, linkedin, github, portfolio, location, militaryStatus });
                                        }}
                                        className="text-[10px] font-bold text-[#BC5C29] hover:underline cursor-pointer"
                                        title="Set to new official YA emblem"
                                    >
                                        Use YA Logo
                                    </button>
                                </div>
                                <p className="text-[10px] text-[#6E5A4E] dark:text-[#D1C5BC]">
                                    Live preview of official brand logo for invoices and headers.
                                </p>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                                    <label className="bg-[#BC5C29] text-white hover:bg-[#BC5C29]/90 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition inline-flex items-center gap-1.5 shadow-xs">
                                        <span>🖼️</span> <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                                        <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} className="hidden" />
                                    </label>
                                    {driveFiles.length > 0 && (
                                        <div className="relative max-w-[130px] sm:max-w-[160px]">
                                            <select
                                                onChange={e => {
                                                    if (e.target.value) {
                                                        setLogo(e.target.value);
                                                        triggerSave({ action: 'save_personal', name, title, photo, logo: e.target.value, cv_url: cvUrl, phone, email, linkedin, github, portfolio, location, militaryStatus });
                                                    }
                                                }}
                                                className="w-full truncate bg-white dark:bg-[#2E0025] border border-[#BC5C29]/25 dark:border-[#BC5C29]/25 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-[#2B2320] dark:text-[#FBF3E9] outline-none cursor-pointer"
                                            >
                                                <option value="">-- Drive --</option>
                                                {driveFiles.map(f => (
                                                    <option key={f.id} value={f.thumbnailUrl}>
                                                        {f.name.length > 22 ? f.name.slice(0, 20) + '...' : f.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 p-4.5 rounded-2xl bg-[#FAF4EF]/50 dark:bg-[#2E0025]/40 border border-[#BC5C29]/25 dark:border-[#BC5C29]/25 shadow-xs transition min-w-0">
                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#BC5C29]/30 dark:border-[#BC5C29]/40 bg-[#FAF4EF] dark:bg-[#2E0025] shrink-0 shadow-sm flex flex-col items-center justify-center p-1.5 text-center">
                                <FileText className="w-8 h-8 text-[#BC5C29] mb-1" />
                                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    {cvUrl ? 'PDF/DOC' : 'NO CV'}
                                </span>
                            </div>
                            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-xs font-bold text-[#2B2320] dark:text-[#FBF3E9] uppercase tracking-wide">
                                        Curriculum Vitae (CV)
                                    </h4>
                                    {cvUrl && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCvUrl('');
                                                triggerSave({ action: 'save_personal', name, title, photo, logo, cv_url: '', phone, email, linkedin, github, portfolio, location, militaryStatus });
                                            }}
                                            className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                                            title="Clear CV URL"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-[#6E5A4E] dark:text-[#D1C5BC] truncate">
                                    {cvUrl ? (
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center sm:justify-start gap-1">
                                            <CheckCircle2 className="w-3 h-3 shrink-0" /> Live CV Attached
                                        </span>
                                    ) : (
                                        'Upload PDF/DOCX or link Drive file.'
                                    )}
                                </p>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                                    <label className="bg-[#2E0025] text-[#FBF3E9] hover:bg-[#2E0025]/90 dark:bg-[#FAF4EF] dark:text-[#2B2320] px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition inline-flex items-center gap-1.5 shadow-xs">
                                        <span>📄</span> <span>{uploadingCv ? 'Uploading...' : 'Upload CV'}</span>
                                        <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleCvUpload} disabled={uploadingCv} className="hidden" />
                                    </label>
                                    {cvUrl && (
                                        <a
                                            href={cvUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[#BC5C29]/40 text-[#2B2320] dark:text-[#FBF3E9] hover:bg-[#BC5C29]/15 transition inline-flex items-center gap-1 shadow-2xs"
                                        >
                                            <span>View</span> <span>↗</span>
                                        </a>
                                    )}
                                    {driveFiles.length > 0 && (
                                        <div className="relative max-w-[130px] sm:max-w-[160px]">
                                            <select
                                                onChange={e => {
                                                    if (e.target.value) {
                                                        setCvUrl(e.target.value);
                                                        triggerSave({ action: 'save_personal', name, title, photo, logo, cv_url: e.target.value, phone, email, linkedin, github, portfolio, location, militaryStatus });
                                                    }
                                                }}
                                                className="w-full truncate bg-white dark:bg-[#2E0025] border border-[#BC5C29]/25 dark:border-[#BC5C29]/25 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-[#2B2320] dark:text-[#FBF3E9] outline-none cursor-pointer"
                                            >
                                                <option value="">-- Drive --</option>
                                                {driveFiles.map(f => (
                                                    <option key={f.id} value={f.downloadUrl || f.viewUrl || f.thumbnailUrl}>
                                                        {f.name.length > 22 ? f.name.slice(0, 20) + '...' : f.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSavePersonal} className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-bold text-zinc-400 mb-1 uppercase">Full Name</label>
                                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <div>
                                <label className="block font-bold text-zinc-400 mb-1 uppercase">Job Title</label>
                                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <div>
                                <label className="block font-bold text-zinc-400 mb-1 uppercase">Profile Photo URL (or Drive Link)</label>
                                <input type="text" value={photo} onChange={e => setPhoto(e.target.value)} placeholder="/user.png or Drive direct URL" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <div>
                                <label className="block font-bold text-zinc-400 mb-1 uppercase">Brand Logo URL (or Drive Link)</label>
                                <input type="text" value={logo} onChange={e => setLogo(e.target.value)} placeholder="/icon.svg or Drive direct URL" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block font-bold text-zinc-400 mb-1 uppercase">Curriculum Vitae (CV / Resume) Direct URL or File Path</label>
                                <input type="text" value={cvUrl} onChange={e => setCvUrl(e.target.value)} placeholder="/uploads/profile/cv.pdf or Google Drive link" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <div>
                                <label className="block font-bold text-zinc-400 mb-1 uppercase">Location</label>
                                <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <div>
                                <label className="block font-bold text-zinc-400 mb-1 uppercase">Phone</label>
                                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <div>
                                <label className="block font-bold text-zinc-400 mb-1 uppercase">Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <div>
                                <label className="block font-bold text-zinc-400 mb-1 uppercase">LinkedIn URL</label>
                                <input type="text" value={linkedin} onChange={e => setLinkedin(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl" />
                            </div>
                            <div>
                                <label className="block font-bold text-zinc-400 mb-1 uppercase">GitHub URL</label>
                                <input type="text" value={github} onChange={e => setGithub(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl" />
                            </div>
                            <div>
                                <label className="block font-bold text-zinc-400 mb-1 uppercase">Portfolio URL</label>
                                <input type="text" value={portfolio} onChange={e => setPortfolio(e.target.value)} placeholder="https://yossef.live" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl" />
                            </div>
                            <div>
                                <label className="block font-bold text-zinc-400 mb-1 uppercase">Military Status</label>
                                <input type="text" value={militaryStatus} onChange={e => setMilitaryStatus(e.target.value)} placeholder="Completed Military Service" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                        </div>
                        <button type="submit" disabled={savingBasic} className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-6 py-2.5 rounded-full font-bold transition">
                            {savingBasic ? 'Saving...' : 'Save Personal Details'}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'about' && (
                <div className="bg-white dark:bg-[#1A1A1A] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs space-y-6">
                    <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        About Summary, Bullet Points &amp; Core Expertise
                    </h3>
                    <form onSubmit={handleSaveAbout} className="space-y-4 text-xs">
                        <div>
                            <label className="block font-bold text-zinc-400 mb-1 uppercase">Summary</label>
                            <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={5} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl font-medium" />
                        </div>
                        <button type="submit" disabled={savingSummary} className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-6 py-2 rounded-full font-bold">
                            {savingSummary ? 'Saving...' : 'Save Summary'}
                        </button>
                    </form>

                    <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase">What I Do (Bullet Points)</h4>
                        <form onSubmit={handleAddWhatIDo} className="flex gap-2">
                            <input type="text" value={newWhatItem} onChange={e => setNewWhatItem(e.target.value)} placeholder="Add bullet point..." className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl text-xs" />
                            <button type="submit" className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 rounded-xl text-xs font-bold">+ Add</button>
                        </form>
                        <div className="space-y-2">
                            {whatIDo.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs">
                                    <span>• {item}</span>
                                    <button onClick={() => requestDelete(() => handleDeleteWhatIDo(idx), t("Delete item", "حذف العنصر"))} className="text-rose-500 font-bold">Delete</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase">Core Expertise Pillars</h4>
                        <form onSubmit={handleAddCoreExpertise} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input type="text" required value={newCoreTitle} onChange={e => setNewCoreTitle(e.target.value)} placeholder="Title (e.g. Back-End Development)" className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl text-xs font-bold" />
                            <input type="text" value={newCoreDesc} onChange={e => setNewCoreDesc(e.target.value)} placeholder="Description (e.g. PHP, Laravel, Node.js...)" className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl text-xs" />
                            <button type="submit" className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 rounded-xl text-xs font-bold">+ Add Core Expertise</button>
                        </form>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {coreExpertise.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs">
                                    <div>
                                        <span className="font-bold block text-zinc-900 dark:text-white">{item.title}</span>
                                        {item.description && <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">{item.description}</span>}
                                    </div>
                                    <button onClick={() => requestDelete(() => handleDeleteCoreExpertise(idx), t("Delete expertise", "حذف التخصص"))} className="text-rose-500 font-bold shrink-0">Delete</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                        {/* Header & Filter Pills */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
                            <div>
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <Sparkles size={16} className="text-[#BC5C29]" />
                                    <span>{t("Complete Portfolio Copy, SEO & Media Control", "التحكم الشامل في نصوص الموقع، السيو والميديا")}</span>
                                </h4>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    {t("Every word, metric, video, code snippet, and SEO meta tag is 100% dynamic and stored in the database.", "كل كلمة، رقم، فيديو، كود برمجي وبيانات السيو مربوطة ومتحكم بها بالكامل من قاعدة البيانات.")}
                                </p>
                            </div>

                            {/* Page Filter Buttons */}
                            <div className="flex flex-wrap gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
                                {[
                                    { id: 'all', label: 'All Sections' },
                                    { id: 'home', label: 'Home Page' },
                                    { id: 'systems', label: 'Systems Page' },
                                    { id: 'profile', label: 'Profile Page' },
                                    { id: 'inquiry', label: 'Inquiry Page' },
                                    { id: 'seo', label: 'SEO & Meta Tags' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setSectionFilter(tab.id)}
                                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${sectionFilter === tab.id
                                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sections Stream */}
                        <div className="space-y-6">
                            {sectionsList
                                .filter((sec) => {
                                    if (sectionFilter === 'all') return true;
                                    if (sectionFilter === 'seo') return sec.section_key === 'seo_meta';
                                    return sec.page === sectionFilter;
                                })
                                .map((sec) => {
                                    const meta = sec.meta && typeof sec.meta === 'object' ? sec.meta : {};

                                    return (
                                        <div
                                            key={sec.section_key}
                                            className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 space-y-4 text-xs shadow-xs transition hover:border-[#BC5C29]/40"
                                        >
                                            {/* Card Top Bar */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-md bg-[#FAF4EF] dark:bg-[#2E0025] text-[#BC5C29] font-bold border border-[#BC5C29]/20">
                                                        {sec.page}
                                                    </span>
                                                    <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono text-xs">
                                                        {sec.section_key}
                                                    </span>
                                                    {sec.title && (
                                                        <span className="text-zinc-400 dark:text-zinc-500 text-[11px] truncate max-w-[200px]">
                                                            — {sec.title}
                                                        </span>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={savingSectionKey === sec.section_key}
                                                    onClick={() => handleSaveSection(sec)}
                                                    className="inline-flex items-center gap-1.5 bg-[#2E0025] hover:bg-[#2E0025]/90 text-white dark:bg-[#FAF4EF] dark:text-[#2E0025] px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                                                >
                                                    {savingSectionKey === sec.section_key ? (
                                                        <>
                                                            <span className="animate-spin text-[10px]">⏳</span>
                                                            <span>{t("Saving...", "جاري الحفظ...")}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Check size={13} />
                                                            <span>{t("Save Section", "حفظ القسم")}</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Specialized Editor 1: SEO & Meta Tags */}
                                            {sec.section_key === 'seo_meta' ? (
                                                <div className="space-y-4 pt-1">
                                                    {/* Route Tabs */}
                                                    <div className="flex flex-wrap gap-1 bg-zinc-200/60 dark:bg-zinc-900 p-1 rounded-xl">
                                                        {[
                                                            { route: '/', label: 'Home Page (/)' },
                                                            { route: '/systems', label: 'Systems Catalog (/systems)' },
                                                            { route: '/profile', label: 'Engineering Profile (/profile)' },
                                                            { route: '/inquiry', label: 'Inquiry Wizard (/inquiry)' },
                                                        ].map((tab) => (
                                                            <button
                                                                key={tab.route}
                                                                type="button"
                                                                onClick={() => setActiveSeoTab(tab.route)}
                                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeSeoTab === tab.route
                                                                    ? 'bg-white dark:bg-zinc-800 text-[#BC5C29] shadow-xs'
                                                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                                                                    }`}
                                                            >
                                                                {tab.label}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Active Route SEO Fields */}
                                                    {(() => {
                                                        const routeSeo = meta[activeSeoTab] || {};
                                                        const updateRouteField = (field, val) => {
                                                            const updatedMeta = {
                                                                ...meta,
                                                                [activeSeoTab]: {
                                                                    ...routeSeo,
                                                                    [field]: val
                                                                }
                                                            };
                                                            handleUpdateSectionField('seo_meta', 'meta', updatedMeta);
                                                        };

                                                        return (
                                                            <div className="space-y-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                                                <div>
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <label className="text-[10px] font-bold text-zinc-400 uppercase">
                                                                            Page Title (&lt;title&gt;)
                                                                        </label>
                                                                        <span className="text-[10px] text-zinc-400 font-mono">
                                                                            {(routeSeo.title || '').length} chars
                                                                        </span>
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        value={routeSeo.title || ''}
                                                                        onChange={e => updateRouteField('title', e.target.value)}
                                                                        placeholder="e.g. Yossef Ashraf | Mid-Level Backend PHP/Laravel Engineer"
                                                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-semibold"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <label className="text-[10px] font-bold text-zinc-400 uppercase">
                                                                            Meta Description (Search &amp; Social Snippet)
                                                                        </label>
                                                                        <span className="text-[10px] text-zinc-400 font-mono">
                                                                            {(routeSeo.description || '').length} chars (150-160 recommended)
                                                                        </span>
                                                                    </div>
                                                                    <textarea
                                                                        rows={2}
                                                                        value={routeSeo.description || ''}
                                                                        onChange={e => updateRouteField('description', e.target.value)}
                                                                        placeholder="Concise overview of page content for Google and search crawlers..."
                                                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                                                                        Meta Keywords (Comma separated)
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={routeSeo.keywords || ''}
                                                                        onChange={e => updateRouteField('keywords', e.target.value)}
                                                                        placeholder="Backend Engineer, Laravel, PHP, MySQL, Redis, High Concurrency..."
                                                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs"
                                                                    />
                                                                </div>

                                                                {/* OG Banner Image Control */}
                                                                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                                                                        Social Share Banner (OpenGraph / Twitter Card Image)
                                                                    </label>
                                                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                                                        <input
                                                                            type="text"
                                                                            value={routeSeo.ogImage || ''}
                                                                            onChange={e => updateRouteField('ogImage', e.target.value)}
                                                                            placeholder="https://yossef-ashraf.pages.dev/og-banner.png"
                                                                            className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-mono"
                                                                        />
                                                                        <label className="bg-[#2E0025] text-white dark:bg-zinc-800 dark:text-zinc-100 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition shrink-0 inline-flex items-center gap-1.5">
                                                                            <UploadCloud size={14} />
                                                                            <span>{uploadingOgImage ? 'Uploading to Drive...' : 'Upload Banner'}</span>
                                                                            <input
                                                                                type="file"
                                                                                accept="image/*"
                                                                                disabled={uploadingOgImage}
                                                                                onChange={e => handleOgImageUpload(e, activeSeoTab)}
                                                                                className="hidden"
                                                                            />
                                                                        </label>
                                                                    </div>
                                                                    {routeSeo.ogImage && (
                                                                        <div className="mt-2 w-48 h-24 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950">
                                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                            <img
                                                                                src={routeSeo.ogImage}
                                                                                alt="OG Banner Preview"
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Google Search Card Preview */}
                                                                <div className="mt-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800">
                                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                                                                        Search Result Live Preview:
                                                                    </span>
                                                                    <span className="text-xs text-[#1a0dab] dark:text-[#8ab4f8] font-medium block truncate">
                                                                        {routeSeo.title || 'Page Title'}
                                                                    </span>
                                                                    <span className="text-[10px] text-[#006621] dark:text-[#a8dadc] block truncate">
                                                                        https://yossef-ashraf.pages.dev{activeSeoTab === '/' ? '' : activeSeoTab}
                                                                    </span>
                                                                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-0.5">
                                                                        {routeSeo.description || 'Description snippet displayed in Google search results...'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            ) : sec.section_key === 'home_hero' ? (
                                                /* Specialized Editor 2: Home Hero with Video & Drive Media */
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Headline Part 1 (Bold Title)</label>
                                                            <input
                                                                type="text"
                                                                value={sec.title || ''}
                                                                onChange={e => handleUpdateSectionField(sec.section_key, 'title', e.target.value)}
                                                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Headline Part 2 (Italic Subtitle)</label>
                                                            <input
                                                                type="text"
                                                                value={sec.subtitle || ''}
                                                                onChange={e => handleUpdateSectionField(sec.section_key, 'subtitle', e.target.value)}
                                                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs italic"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Hero Statement / Paragraph</label>
                                                        <textarea
                                                            value={sec.content || ''}
                                                            onChange={e => handleUpdateSectionField(sec.section_key, 'content', e.target.value)}
                                                            rows={2}
                                                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Eyebrow Badge</label>
                                                            <input
                                                                type="text"
                                                                value={meta.badge || ''}
                                                                onChange={e => handleUpdateSectionField(sec.section_key, 'meta', { ...meta, badge: e.target.value })}
                                                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg text-xs"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Primary CTA Button</label>
                                                            <input
                                                                type="text"
                                                                value={meta.cta_primary || ''}
                                                                onChange={e => handleUpdateSectionField(sec.section_key, 'meta', { ...meta, cta_primary: e.target.value })}
                                                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg text-xs"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Secondary CTA Button</label>
                                                            <input
                                                                type="text"
                                                                value={meta.cta_secondary || ''}
                                                                onChange={e => handleUpdateSectionField(sec.section_key, 'meta', { ...meta, cta_secondary: e.target.value })}
                                                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg text-xs"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Hero Video & Google Drive Media Control Box */}
                                                    <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                                                        <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-bold text-xs uppercase tracking-wide">
                                                            <Film size={15} className="text-[#BC5C29]" />
                                                            <span>{t("Hero Video & Architecture Media", "فيديو الهيرو وميديا درايف")}</span>
                                                        </div>

                                                        <div className="flex flex-col sm:flex-row items-center gap-3">
                                                            <input
                                                                type="text"
                                                                value={meta.video_url || ''}
                                                                onChange={e => handleUpdateSectionField(sec.section_key, 'meta', { ...meta, video_url: e.target.value })}
                                                                placeholder="/backend-hero.mp4 or Google Drive Video URL"
                                                                className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-mono"
                                                            />

                                                            {/* Upload Video to Google Drive */}
                                                            <label className="bg-[#BC5C29] hover:bg-[#BC5C29]/90 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition shrink-0 inline-flex items-center gap-1.5 shadow-xs">
                                                                <UploadCloud size={14} />
                                                                <span>{uploadingVideo ? 'Uploading to Drive...' : 'Upload Video to Drive'}</span>
                                                                <input
                                                                    type="file"
                                                                    accept="video/mp4,video/webm,video/*"
                                                                    disabled={uploadingVideo}
                                                                    onChange={e => handleVideoUpload(e, sec.section_key)}
                                                                    className="hidden"
                                                                />
                                                            </label>

                                                            {/* Choose from existing Drive files */}
                                                            {driveFiles.length > 0 && (
                                                                <select
                                                                    onChange={e => {
                                                                        if (e.target.value) {
                                                                            handleUpdateSectionField(sec.section_key, 'meta', { ...meta, video_url: e.target.value });
                                                                        }
                                                                    }}
                                                                    className="max-w-[160px] truncate bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl text-xs font-semibold cursor-pointer"
                                                                >
                                                                    <option value="">📁 Select Drive File</option>
                                                                    {driveFiles.map((f, i) => (
                                                                        <option key={i} value={f.directUrl || f.url || f.webContentLink}>
                                                                            {f.name || f.filename}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                        </div>

                                                        {/* Video Caption & Live Player Preview */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                                                                    Video Bottom Badge Caption (Multiline)
                                                                </label>
                                                                <textarea
                                                                    rows={3}
                                                                    value={meta.video_caption || ''}
                                                                    onChange={e => handleUpdateSectionField(sec.section_key, 'meta', { ...meta, video_caption: e.target.value })}
                                                                    placeholder="API FLOW / ARCHITECTURE STUDY&#10;BACKEND ENGINEERING"
                                                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg text-xs font-mono"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                                                                    Live Player Preview
                                                                </label>
                                                                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-900 flex items-center justify-center">
                                                                    {meta.video_url ? (
                                                                        <video
                                                                            key={resolveStreamableVideoUrl(meta.video_url)}
                                                                            src={resolveStreamableVideoUrl(meta.video_url)}
                                                                            controls
                                                                            autoPlay
                                                                            muted
                                                                            loop
                                                                            playsInline
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <span className="text-zinc-500 font-mono text-[11px]">No video selected</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : sec.section_key === 'working_stack' ? (
                                                /* Specialized Editor 3: Working Stack & Code Snippets */
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Section Title</label>
                                                            <input
                                                                type="text"
                                                                value={sec.title || ''}
                                                                onChange={e => handleUpdateSectionField(sec.section_key, 'title', e.target.value)}
                                                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Section Subtitle</label>
                                                            <input
                                                                type="text"
                                                                value={sec.subtitle || ''}
                                                                onChange={e => handleUpdateSectionField(sec.section_key, 'subtitle', e.target.value)}
                                                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs italic"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                                                        <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-bold text-xs uppercase tracking-wide">
                                                            <Code2 size={15} className="text-[#BC5C29]" />
                                                            <span>{t("Architecture Study Code Snippets by Category", "أكواد دراسة الباك ايند والمعمارية")}</span>
                                                        </div>

                                                        {/* Snippet Category Tabs */}
                                                        <div className="flex flex-wrap gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl">
                                                            {[
                                                                { id: 'core-commerce', label: 'Core Commerce' },
                                                                { id: 'frameworks-engines', label: 'Frameworks & Engines' },
                                                                { id: 'databases-storage', label: 'Databases & SQL' },
                                                                { id: 'realtime-events', label: 'Realtime Events' },
                                                                { id: 'integrations-automation', label: 'Integrations & Webhooks' },
                                                            ].map((cat) => (
                                                                <button
                                                                    key={cat.id}
                                                                    type="button"
                                                                    onClick={() => setActiveSnippetTab(cat.id)}
                                                                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${activeSnippetTab === cat.id
                                                                        ? 'bg-white dark:bg-zinc-800 text-[#BC5C29] shadow-xs'
                                                                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                                                                        }`}
                                                                >
                                                                    {cat.label}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {/* Active Snippet Editor */}
                                                        {(() => {
                                                            const snippets = meta.snippets || {};
                                                            const activeSnippet = snippets[activeSnippetTab] || {};
                                                            const updateSnippetField = (field, val) => {
                                                                const updatedSnippets = {
                                                                    ...snippets,
                                                                    [activeSnippetTab]: {
                                                                        ...activeSnippet,
                                                                        [field]: val
                                                                    }
                                                                };
                                                                handleUpdateSectionField(sec.section_key, 'meta', {
                                                                    ...meta,
                                                                    snippets: updatedSnippets
                                                                });
                                                            };

                                                            return (
                                                                <div className="space-y-3 pt-2">
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                                                                            File Name Header
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={activeSnippet.file || ''}
                                                                            onChange={e => updateSnippetField('file', e.target.value)}
                                                                            placeholder="e.g. OrderFulfillmentPipeline.php"
                                                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-mono font-bold"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                                                                            Code Content (PHP / SQL / TS)
                                                                        </label>
                                                                        <textarea
                                                                            rows={10}
                                                                            value={activeSnippet.code || ''}
                                                                            onChange={e => updateSnippetField('code', e.target.value)}
                                                                            placeholder="Write production code snippet here..."
                                                                            className="w-full bg-zinc-900 text-zinc-100 border border-zinc-800 p-3 rounded-lg text-xs font-mono leading-relaxed"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            ) : sec.section_key === 'metrics_strip' ? (
                                                /* Specialized Editor 4: Metrics Strip */
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                                        {(Array.isArray(meta.items) ? meta.items : []).map((m, idx) => (
                                                            <div key={idx} className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Value ({idx + 1})</label>
                                                                    <input
                                                                        type="text"
                                                                        value={m.value || ''}
                                                                        onChange={e => {
                                                                            const updatedItems = [...meta.items];
                                                                            updatedItems[idx] = { ...m, value: e.target.value };
                                                                            handleUpdateSectionField(sec.section_key, 'meta', { ...meta, items: updatedItems });
                                                                        }}
                                                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg text-sm font-bold text-[#BC5C29]"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Label</label>
                                                                    <input
                                                                        type="text"
                                                                        value={m.label || ''}
                                                                        onChange={e => {
                                                                            const updatedItems = [...meta.items];
                                                                            updatedItems[idx] = { ...m, label: e.target.value };
                                                                            handleUpdateSectionField(sec.section_key, 'meta', { ...meta, items: updatedItems });
                                                                        }}
                                                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg text-xs font-semibold"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Description</label>
                                                                    <textarea
                                                                        rows={2}
                                                                        value={m.desc || m.sub || ''}
                                                                        onChange={e => {
                                                                            const updatedItems = [...meta.items];
                                                                            updatedItems[idx] = { ...m, desc: e.target.value };
                                                                            handleUpdateSectionField(sec.section_key, 'meta', { ...meta, items: updatedItems });
                                                                        }}
                                                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg text-[11px]"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : sec.section_key === 'home_strip' ? (
                                                /* Specialized Editor 5: Numbers Strip */
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Right Note Line 1</label>
                                                            <input
                                                                type="text"
                                                                value={sec.title || ''}
                                                                onChange={e => handleUpdateSectionField(sec.section_key, 'title', e.target.value)}
                                                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg text-xs font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Right Note Line 2</label>
                                                            <input
                                                                type="text"
                                                                value={sec.subtitle || ''}
                                                                onChange={e => handleUpdateSectionField(sec.section_key, 'subtitle', e.target.value)}
                                                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg text-xs font-bold"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        {(Array.isArray(meta.items) ? meta.items : []).map((st, idx) => (
                                                            <div key={idx} className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Counter ({idx + 1})</label>
                                                                    <input
                                                                        type="text"
                                                                        value={st.value || ''}
                                                                        onChange={e => {
                                                                            const updated = [...meta.items];
                                                                            updated[idx] = { ...st, value: e.target.value };
                                                                            handleUpdateSectionField(sec.section_key, 'meta', { ...meta, items: updated });
                                                                        }}
                                                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg text-base font-bold text-[#BC5C29]"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Label</label>
                                                                    <input
                                                                        type="text"
                                                                        value={st.label || ''}
                                                                        onChange={e => {
                                                                            const updated = [...meta.items];
                                                                            updated[idx] = { ...st, label: e.target.value };
                                                                            handleUpdateSectionField(sec.section_key, 'meta', { ...meta, items: updated });
                                                                        }}
                                                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg text-xs font-semibold"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Universal Section Editor */
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Title</label>
                                                            <input
                                                                type="text"
                                                                value={sec.title || ''}
                                                                onChange={e => handleUpdateSectionField(sec.section_key, 'title', e.target.value)}
                                                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg text-xs font-bold"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Subtitle</label>
                                                            <input
                                                                type="text"
                                                                value={sec.subtitle || ''}
                                                                onChange={e => handleUpdateSectionField(sec.section_key, 'subtitle', e.target.value)}
                                                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Content / Body</label>
                                                        <textarea
                                                            value={sec.content || ''}
                                                            onChange={e => handleUpdateSectionField(sec.section_key, 'content', e.target.value)}
                                                            rows={2}
                                                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Meta JSON Configuration</label>
                                                        <textarea
                                                            value={typeof sec.meta === 'string' ? sec.meta : JSON.stringify(sec.meta || {}, null, 2)}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                try {
                                                                    const parsed = JSON.parse(val);
                                                                    handleUpdateSectionField(sec.section_key, 'meta', parsed);
                                                                } catch {
                                                                    handleUpdateSectionField(sec.section_key, 'meta', val);
                                                                }
                                                            }}
                                                            rows={3}
                                                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg text-[11px] font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                </div>
            )}

            {activeTab === 'experience' && (
                <div className="bg-white dark:bg-[#1A1A1A] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs space-y-6">
                    <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        Work Experience Timeline
                    </h3>
                    <form onSubmit={handleAddExperience} className="space-y-3 text-xs border-b border-zinc-200 dark:border-zinc-800 pb-5">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <input type="text" placeholder="Company (e.g. MitchDesigns)" required value={expCompany} onChange={e => setExpCompany(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            <input type="text" placeholder="Role (e.g. Back-End PHP Developer)" required value={expRole} onChange={e => setExpRole(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            <input type="text" placeholder="Duration (e.g. Sep 2024 – Present)" value={expDuration} onChange={e => setExpDuration(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            <input type="text" placeholder="Company Website Link (optional)" value={expLink} onChange={e => setExpLink(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />

                            <select value={expLogo} onChange={e => setExpLogo(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold">
                                <option value="https://lh3.googleusercontent.com/d/1D5C7mc5QEqCKHqLJVQRrOF7xr0rEGhSt">MitchDesigns Google Drive Logo</option>
                                <option value="https://lh3.googleusercontent.com/d/160GElANn20Jy9p6LVUs2DV1ixgZkch-B">Etolv ERP Google Drive Logo</option>
                                <option value="https://lh3.googleusercontent.com/d/1R6xBYRhKSvzaN-YjQ_Sa7_58Z3p32LBj">OnCreation Google Drive Logo</option>
                                <option value="https://lh3.googleusercontent.com/d/1ytPSpL2XoF0HsGudg4qzen2GRaofBJi7">Freelance / YA Google Drive Logo</option>
                                {driveFiles.map(f => (
                                    <option key={f.id} value={f.thumbnailUrl}>Drive: {f.name}</option>
                                ))}
                            </select>
                        </div>
                        <textarea placeholder="Role Description & Achievements (use • for bullet points)..." value={expDesc} onChange={e => setExpDesc(e.target.value)} rows={3} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl" />
                        <button type="submit" disabled={savingExp} className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 rounded-full font-bold">
                            + Add Experience Item
                        </button>
                    </form>

                    <div className="space-y-3">
                        {experiences.map((exp, idx) => (
                            <div key={idx} className="flex justify-between items-start gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0 font-bold text-xs">
                                        {exp.logo ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={exp.logo} alt={exp.company} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                                        ) : (
                                            <span>🏢</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-black text-xs text-zinc-900 dark:text-white">{exp.role} @ {exp.company}</h4>
                                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-zinc-400 font-bold">{exp.duration}</span>
                                            {exp.link && (
                                                <a href={exp.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#BC5C29] hover:underline font-bold">
                                                    {exp.link} ↗
                                                </a>
                                            )}
                                        </div>
                                        {exp.description && (
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 whitespace-pre-line">{exp.description}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button onClick={() => handleOpenEditExp(exp, idx)} className="text-xs p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold" title="Edit Experience">Edit</button>
                                    <button onClick={() => requestDelete(() => handleDeleteExperience(idx), t("Delete experience", "حذف الخبرة"))} className="text-rose-500 font-bold text-xs" title="Delete Experience">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'education' && (
                <div className="bg-white dark:bg-[#1A1A1A] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs space-y-6">
                    <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        Education &amp; Certificates
                    </h3>

                    <form onSubmit={handleAddEducation} className="space-y-3 text-xs border-b border-zinc-200 dark:border-zinc-800 pb-5">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <input type="text" placeholder="Degree" required value={eduDegree} onChange={e => setEduDegree(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            <input type="text" placeholder="Institution" required value={eduInstitution} onChange={e => setEduInstitution(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            <input type="text" placeholder="Year (e.g. 2024 - 2025)" value={eduYear} onChange={e => setEduYear(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            <input type="text" placeholder="Grade (e.g. GPA: 3.6 / 4.0)" value={eduGrade} onChange={e => setEduGrade(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                        </div>
                        <textarea placeholder="Education Description (focus areas, coursework, achievements)..." value={eduDesc} onChange={e => setEduDesc(e.target.value)} rows={2} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl" />
                        <button type="submit" disabled={savingEdu} className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 rounded-full font-bold">
                            + Add Education
                        </button>
                    </form>

                    <div className="space-y-3">
                        {educationList.map((edu, idx) => (
                            <div key={idx} className="flex justify-between items-start gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
                                <div>
                                    <h4 className="font-bold text-xs text-zinc-900 dark:text-white">{edu.degree}</h4>
                                    <span className="text-[10px] text-zinc-400 block">{edu.institution} ({edu.year}){edu.grade ? ` • ${edu.grade}` : ''}</span>
                                    {edu.description && (
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">{edu.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button onClick={() => handleOpenEditEdu(edu, idx)} className="text-xs p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold" title="Edit Education">Edit</button>
                                    <button onClick={() => requestDelete(() => handleDeleteEducation(idx), t("Delete education", "حذف التعليم"))} className="text-rose-500 font-bold text-xs" title="Delete Education">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase">Certifications</h4>
                        <form onSubmit={handleAddCertificate} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <input type="text" placeholder="Cert Name" required value={certName} onChange={e => setCertName(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl text-xs" />
                            <input type="text" placeholder="Institution" value={certInst} onChange={e => setCertInst(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl text-xs" />
                            <input type="text" placeholder="Date" value={certDate} onChange={e => setCertDate(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl text-xs" />
                            <button type="submit" className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3 py-2 rounded-xl text-xs font-bold">+ Add Cert</button>
                        </form>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {certList.map((c, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs">
                                    <div>
                                        <span className="font-bold block text-zinc-900 dark:text-white">{c.name}</span>
                                        <span className="text-[10px] text-zinc-400">{c.institution} • {c.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleOpenEditCert(c, idx)} className="text-xs p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold" title="Edit Cert">Edit</button>
                                        <button onClick={() => requestDelete(() => handleDeleteCertificate(idx), t("Delete certificate", "حذف الشهادة"))} className="text-rose-500 font-bold">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'projects' && (
                <div className="bg-white dark:bg-[#1A1A1A] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs space-y-6 animate-fade-in">
                    <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#BC5C29]"></span>
                                <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                                    Projects Portfolio &amp; 3D Globe Locations ({projectsList.length})
                                </h3>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                {t("Drag & drop cards or click ↑ / ↓ arrows to reorder. Ordered sequence is saved to API and powers the portfolio.", "اسحب وأفلت الكروت أو استخدم أسهم ↑ / ↓ للترتيب. الترتيب يُحفظ ويرسل للـ API فوراً.")}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {savingProjectsOrder && (
                                <span className="text-xs font-bold text-[#BC5C29] flex items-center gap-1.5 animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-[#BC5C29]"></span>
                                    <span>{t("Saving order to API...", "جاري حفظ الترتيب...")}</span>
                                </span>
                            )}
                            {projectsOrderSavedNotice && (
                                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{t("Order saved!", "تم حفظ الترتيب!")}</span>
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => handleReorderProjects(0, 0)}
                                disabled={savingProjectsOrder}
                                className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                                <span>💾</span>
                                <span>{t("Save Order", "حفظ الترتيب")}</span>
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleAddProject} className="space-y-3 text-xs border-b border-zinc-200 dark:border-zinc-800 pb-5">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <input type="text" placeholder="Project Name *" required value={projName} onChange={e => setProjName(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            <input type="text" placeholder="Role (e.g. Back-End Developer)" value={projRole} onChange={e => setProjRole(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            <div className="flex flex-col gap-1.5">
                                <select
                                    value={companyOptions.includes(projCompany) ? projCompany : (projCompany ? 'Other' : '')}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'Other') {
                                            setProjCompany('');
                                        } else {
                                            handleCompanyChangeForAdd(val);
                                        }
                                    }}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                                >
                                    <option value="">Select Company / Client...</option>
                                    <option value="Freelance">Freelance (Personal Brand)</option>
                                    {companyOptions.filter(c => c !== 'Freelance').map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                    <option value="Other">Other / Custom</option>
                                </select>
                                {(!companyOptions.includes(projCompany) || projCompany === '') && (
                                    <input
                                        type="text"
                                        placeholder="Or type custom company..."
                                        value={projCompany}
                                        onChange={e => handleCompanyChangeForAdd(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl text-xs font-bold"
                                    />
                                )}
                            </div>
                            <input type="text" placeholder="Live Website Link (https://...)" value={projLink} onChange={e => setProjLink(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                            <select
                                value={projCategory}
                                onChange={e => setProjCategory(e.target.value)}
                                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer"
                                title="Portfolio Category"
                            >
                                {PROJECT_CATEGORIES.map(cat => (
                                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                                ))}
                            </select>
                            <input type="text" placeholder="Company Logo URL (/mitchdesigns_logo.jpeg)" value={projLogo} onChange={e => setProjLogo(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-mono text-xs" />
                            <input type="text" placeholder="Country / Region (e.g. Egypt, UAE)" value={projCountry} onChange={e => setProjCountry(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold text-xs" />
                            <input type="text" placeholder="Latitude (e.g. 30.0444)" value={projLat} onChange={e => setProjLat(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-mono text-xs text-zinc-600 dark:text-zinc-300" />
                            <input type="text" placeholder="Longitude (e.g. 31.2357)" value={projLng} onChange={e => setProjLng(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-mono text-xs text-zinc-600 dark:text-zinc-300" />
                        </div>
                        <textarea placeholder="Project Technical Description..." value={projDesc} onChange={e => setProjDesc(e.target.value)} rows={2} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl" />
                        <button type="submit" disabled={savingProj} className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-5 py-2.5 rounded-full font-bold cursor-pointer hover:opacity-90 transition">
                            + Add Portfolio Project
                        </button>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projectsList.map((p, idx) => (
                            <div
                                key={idx}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', String(idx));
                                    e.dataTransfer.effectAllowed = 'move';
                                    setDraggedProjIdx(idx);
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'move';
                                    if (dragOverProjIdx !== idx) setDragOverProjIdx(idx);
                                }}
                                onDragLeave={() => {
                                    if (dragOverProjIdx === idx) setDragOverProjIdx(null);
                                }}
                                onDrop={async (e) => {
                                    e.preventDefault();
                                    const sourceIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                                    if (!isNaN(sourceIdx)) {
                                        await handleReorderProjects(sourceIdx, idx);
                                    }
                                    setDraggedProjIdx(null);
                                    setDragOverProjIdx(null);
                                }}
                                onDragEnd={() => {
                                    setDraggedProjIdx(null);
                                    setDragOverProjIdx(null);
                                }}
                                className={`p-4.5 rounded-2xl border transition-all duration-200 space-y-3 flex flex-col justify-between group select-none ${draggedProjIdx === idx
                                    ? 'opacity-30 scale-95 border-dashed border-[#BC5C29] bg-[#BC5C29]/10/50 dark:bg-[#BC5C29]/10'
                                    : dragOverProjIdx === idx
                                        ? 'border-2 border-[#BC5C29] bg-[#BC5C29]/10/40 dark:bg-[#2E0025]/20 shadow-md scale-[1.01]'
                                        : 'border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs'
                                    }`}
                            >
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div
                                                className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-grab active:cursor-grabbing transition"
                                                title={t("Drag to reorder", "اسحب لتغيير الترتيب")}
                                            >
                                                <GripVertical className="w-4 h-4" />
                                            </div>

                                            <span className="px-2 py-0.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-[11px] font-black shrink-0">
                                                #{idx + 1}
                                            </span>

                                            <div className="flex items-center gap-0.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveProject(idx, 'up')}
                                                    disabled={idx === 0}
                                                    className="p-1 rounded-md text-zinc-400 hover:text-[#BC5C29] dark:hover:text-[#BC5C29] hover:bg-zinc-200/60 dark:hover:bg-zinc-800 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                                                    title={t("Move Up", "تحريك لأعلى")}
                                                >
                                                    <ArrowUp className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveProject(idx, 'down')}
                                                    disabled={idx === projectsList.length - 1}
                                                    className="p-1 rounded-md text-zinc-400 hover:text-[#BC5C29] dark:hover:text-[#BC5C29] hover:bg-zinc-200/60 dark:hover:bg-zinc-800 disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer"
                                                    title={t("Move Down", "تحريك لأسفل")}
                                                >
                                                    <ArrowDown className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <img
                                                src={p.logo || logo || 'https://lh3.googleusercontent.com/d/1ytPSpL2XoF0HsGudg4qzen2GRaofBJi7'}
                                                alt={p.company || "Brand Logo"}
                                                className="w-5 h-5 rounded object-contain bg-black/10 dark:bg-white/10 p-0.5 border border-zinc-200 dark:border-zinc-700 shrink-0"
                                                onError={e => {
                                                    const fb = logo || 'https://lh3.googleusercontent.com/d/1ytPSpL2XoF0HsGudg4qzen2GRaofBJi7';
                                                    if (e.target.src !== fb) {
                                                        e.target.src = fb;
                                                    }
                                                }}
                                            />

                                            <h4 className="font-bold text-xs text-zinc-900 dark:text-white truncate" title={p.name}>
                                                {p.name}
                                            </h4>
                                            {p.role && (
                                                <span className="text-[10px] text-zinc-400 font-medium shrink-0">
                                                    ({p.role})
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                                            {(() => {
                                                const catKey = (p.category || 'other').toLowerCase();
                                                const badge = CATEGORY_BADGES[catKey] || CATEGORY_BADGES.other;
                                                return (
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${badge.cls}`}>
                                                        {badge.label}
                                                    </span>
                                                );
                                            })()}
                                            <span className="text-[10px] text-[#BC5C29] font-bold">{p.company || 'MitchDesigns'}</span>
                                            {p.country && (
                                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                                    📍 {p.country}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 pl-6 rtl:pl-0 rtl:pr-6">
                                        {p.description}
                                    </p>
                                </div>

                                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-850 flex justify-between items-center text-xs">
                                    {p.link && p.link !== '#' ? (
                                        <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-[#BC5C29] hover:underline font-bold text-[11px] flex items-center gap-1">
                                            <span>Visit Website</span>
                                            <span>↗</span>
                                        </a>
                                    ) : (
                                        <span className="text-[10px] text-zinc-400 font-mono">Internal Platform</span>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleOpenEditProj(p, idx)} className="text-xs p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold cursor-pointer" title="Edit Project">Edit</button>
                                        <button onClick={() => requestDelete(() => handleDeleteProject(idx), t("Delete project", "حذف المشروع"))} className="text-rose-500 font-bold text-xs cursor-pointer">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'skills' && (
                <div className="bg-white dark:bg-[#1A1A1A] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs space-y-6 animate-fade-in">
                    <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                                <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                                    Core Capabilities &amp; Technical Skills Specialties
                                </h3>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Skills categorized by specialty with a 4-level scale (Beginner to Expert).
                            </p>
                        </div>
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            {Object.values(skillsByCategory).flat().length} Total Skills
                        </span>
                    </div>

                    <form onSubmit={handleAddSkill} className="flex flex-col md:flex-row gap-2.5 text-xs border-b border-zinc-200 dark:border-zinc-800 pb-5">
                        <div className="flex-1 min-w-[200px]">
                            {!isAddingCustomCat ? (
                                <select
                                    value={skillCat}
                                    onChange={e => {
                                        if (e.target.value === '__custom__') {
                                            setIsAddingCustomCat(true);
                                        } else {
                                            setSkillCat(e.target.value);
                                        }
                                    }}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold text-zinc-900 dark:text-white outline-none focus:border-[#BC5C29]"
                                >
                                    <optgroup label="Standard Specialties">
                                        <option value="Backend Development">🖥️ Backend Development</option>
                                        <option value="Frontend Development">🎨 Frontend Development</option>
                                        <option value="Databases">🗄️ Databases &amp; Storage</option>
                                        <option value="DevOps & Infrastructure">☁️ DevOps &amp; Infrastructure</option>
                                        <option value="E-Commerce & CMS">🛍️ E-Commerce &amp; CMS</option>
                                        <option value="Architecture & Engineering">⚙️ Architecture &amp; Engineering</option>
                                    </optgroup>
                                    {Object.keys(skillsByCategory).filter(c => !['Backend Development', 'Frontend Development', 'Databases', 'DevOps & Infrastructure', 'E-Commerce & CMS', 'Architecture & Engineering'].includes(c)).length > 0 && (
                                        <optgroup label="Other Existing Categories">
                                            {Object.keys(skillsByCategory)
                                                .filter(c => !['Backend Development', 'Frontend Development', 'Databases', 'DevOps & Infrastructure', 'E-Commerce & CMS', 'Architecture & Engineering'].includes(c))
                                                .map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                        </optgroup>
                                    )}
                                    <option value="__custom__">➕ + Add Custom Specialty...</option>
                                </select>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="text"
                                        placeholder="Enter new specialty name..."
                                        value={customSkillCat}
                                        onChange={e => setCustomSkillCat(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-[#BC5C29] p-2.5 rounded-xl font-bold text-xs text-zinc-900 dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setIsAddingCustomCat(false); setCustomSkillCat(''); }}
                                        className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-300 transition cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>

                        <input
                            type="text"
                            placeholder="Skill Name (e.g. PHP, Laravel, Docker) *"
                            required
                            value={skillName}
                            onChange={e => setSkillName(e.target.value)}
                            className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold text-zinc-900 dark:text-white outline-none focus:border-[#BC5C29]"
                        />

                        <div className="min-w-[170px]">
                            <select
                                value={skillLevel}
                                onChange={e => setSkillLevel(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold text-zinc-900 dark:text-white text-xs cursor-pointer outline-none focus:border-[#BC5C29]"
                            >
                                <option value="Beginner">🌱 Beginner</option>
                                <option value="Intermediate">⚡ Intermediate</option>
                                <option value="Advanced">🚀 Advanced</option>
                                <option value="Expert">👑 Expert</option>
                            </select>
                        </div>

                        <label className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none shrink-0">
                            <input type="checkbox" checked={skillHighlight} onChange={e => setSkillHighlight(e.target.checked)} className="rounded text-amber-500 focus:ring-amber-400" />
                            <span className="font-bold text-[11px] flex items-center gap-1">
                                <span>⭐</span>
                                <span>Spotlight</span>
                            </span>
                        </label>

                        <button type="submit" disabled={savingSkill} className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-5 py-2.5 rounded-xl font-bold shrink-0 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition cursor-pointer">
                            + Add Skill
                        </button>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(skillsByCategory)
                            .sort(([catA], [catB]) => getCategorySortWeight(catA) - getCategorySortWeight(catB) || catA.localeCompare(catB))
                            .map(([cat, skillList], idx) => {
                                const catLower = cat.toLowerCase();
                                const icon = catLower.includes('back') ? '🖥️'
                                    : catLower.includes('front') ? '🎨'
                                        : catLower.includes('data') ? '🗄️'
                                            : catLower.includes('devops') || catLower.includes('infra') ? '☁️'
                                                : catLower.includes('commerce') || catLower.includes('cms') ? '🛍️'
                                                    : '⚙️';

                                return (
                                    <div key={idx} className="p-4.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3">
                                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-base">{icon}</span>
                                                <h4 className="font-black text-xs uppercase text-zinc-900 dark:text-white tracking-wider">
                                                    {cat}
                                                </h4>
                                            </div>
                                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                                {(skillList || []).length} skills
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {(skillList || []).map((s, sIdx) => {
                                                const sName = s.skill || s.name || 'Skill';
                                                const isHighlight = Boolean(s.highlight || s.is_highlight);
                                                const levelInfo = resolveSkillLevel(s.badge, s.rating);

                                                return (
                                                    <div key={sIdx} className={`flex justify-between items-center text-xs p-2.5 rounded-xl border transition ${isHighlight
                                                        ? 'bg-amber-500/5 border-amber-500/30'
                                                        : 'bg-white dark:bg-zinc-900 border-zinc-150 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
                                                        }`}>
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <span className={`w-2 h-2 rounded-full shrink-0 ${isHighlight ? 'bg-amber-500 ring-2 ring-amber-500/20' : 'bg-zinc-400'}`} />
                                                            <span className="font-bold text-zinc-900 dark:text-white truncate">{sName}</span>

                                                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${levelInfo.badgeBg}`}>
                                                                <span>{levelInfo.icon}</span>
                                                                <span>{levelInfo.en}</span>
                                                            </span>

                                                            {isHighlight && (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                                                                    ⭐ Spotlight
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <button onClick={() => handleOpenEditSkill(cat, s, sIdx)} className="text-xs p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold cursor-pointer" title="Edit Skill">Edit</button>
                                                            <button onClick={() => requestDelete(() => handleDeleteSkill(cat, sIdx), t("Delete skill", "حذف المهارة"))} className="text-rose-500 font-bold text-xs cursor-pointer">Delete</button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {(!skillList || skillList.length === 0) && (
                                                <p className="text-xs text-zinc-400 py-3 text-center">No skills added to this specialty yet.</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {isEditExpOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsEditExpOpen(false); }}
                >
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 space-y-4 shadow-xl">
                        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Edit Experience Item</h3>
                            <button onClick={() => setIsEditExpOpen(false)} className="text-zinc-400 hover:text-zinc-700 text-lg font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateExperience} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Company</label>
                                <input type="text" required value={editExpCompany} onChange={e => setEditExpCompany(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Role / Job Title</label>
                                <input type="text" required value={editExpRole} onChange={e => setEditExpRole(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Duration</label>
                                <input type="text" value={editExpDuration} onChange={e => setEditExpDuration(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Company Website Link</label>
                                <input type="text" value={editExpLink} onChange={e => setEditExpLink(e.target.value)} placeholder="https://..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Company Logo Image / Drive URL</label>
                                <input type="text" value={editExpLogo} onChange={e => setEditExpLogo(e.target.value)} placeholder="/logo.png or Google Drive Image URL" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Role Description & Achievements</label>
                                <textarea value={editExpDesc} onChange={e => setEditExpDesc(e.target.value)} rows={3} placeholder="Achievements and responsibilities..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-medium" />
                            </div>
                            <button type="submit" className="w-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-2.5 rounded-full text-xs font-bold transition">
                                Update Experience
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isEditEduOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsEditEduOpen(false); }}
                >
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 space-y-4 shadow-xl">
                        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Edit Education Item</h3>
                            <button onClick={() => setIsEditEduOpen(false)} className="text-zinc-400 hover:text-zinc-700 text-lg font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateEducation} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Degree Title</label>
                                <input type="text" required value={editEduDegree} onChange={e => setEditEduDegree(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Institution</label>
                                <input type="text" required value={editEduInstitution} onChange={e => setEditEduInstitution(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Year</label>
                                    <input type="text" value={editEduYear} onChange={e => setEditEduYear(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Grade</label>
                                    <input type="text" value={editEduGrade} onChange={e => setEditEduGrade(e.target.value)} placeholder="e.g. GPA 3.6 / 4.0" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Description</label>
                                <textarea value={editEduDesc} onChange={e => setEditEduDesc(e.target.value)} rows={2} placeholder="Coursework, focus, achievements..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-medium" />
                            </div>
                            <button type="submit" className="w-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-2.5 rounded-full text-xs font-bold">
                                Update Education
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isEditCertOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsEditCertOpen(false); }}
                >
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 space-y-4 shadow-xl">
                        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Edit Certification</h3>
                            <button onClick={() => setIsEditCertOpen(false)} className="text-zinc-400 hover:text-zinc-700 text-lg font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateCert} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Certificate Name</label>
                                <input type="text" required value={editCertName} onChange={e => setEditCertName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Institution</label>
                                <input type="text" value={editCertInst} onChange={e => setEditCertInst(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Date</label>
                                <input type="text" value={editCertDate} onChange={e => setEditCertDate(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <button type="submit" className="w-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-2.5 rounded-full text-xs font-bold">
                                Update Certificate
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isEditProjOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsEditProjOpen(false); }}
                >
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 space-y-4 shadow-xl">
                        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Edit Portfolio Project &amp; Location</h3>
                            <button onClick={() => setIsEditProjOpen(false)} className="text-zinc-400 hover:text-zinc-700 text-lg font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateProject} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Project Name</label>
                                <input type="text" required value={editProjName} onChange={e => setEditProjName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Company</label>
                                    <select
                                        value={companyOptions.includes(editProjCompany) ? editProjCompany : (editProjCompany ? 'Other' : '')}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'Other') {
                                                setEditProjCompany('');
                                            } else {
                                                handleCompanyChangeForEdit(val);
                                            }
                                        }}
                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold mb-1.5 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                                    >
                                        <option value="">Select Company...</option>
                                        <option value="Freelance">Freelance (Personal Brand)</option>
                                        {companyOptions.filter(c => c !== 'Freelance').map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                        <option value="Other">Other / Custom</option>
                                    </select>
                                    {(!companyOptions.includes(editProjCompany) || editProjCompany === '') && (
                                        <input
                                            type="text"
                                            placeholder="Enter custom company..."
                                            value={editProjCompany}
                                            onChange={e => handleCompanyChangeForEdit(e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl text-xs font-bold"
                                        />
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Role / Position</label>
                                        <input type="text" value={editProjRole} onChange={e => setEditProjRole(e.target.value)} placeholder="e.g. Back-End Developer" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl text-xs font-bold" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Live Website Link</label>
                                        <input type="text" value={editProjLink} onChange={e => setEditProjLink(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl text-xs font-bold" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Portfolio Category</label>
                                    <select
                                        value={editProjCategory}
                                        onChange={e => setEditProjCategory(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer text-xs"
                                    >
                                        {PROJECT_CATEGORIES.map(cat => (
                                            <option key={cat.key} value={cat.key}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Company Logo URL</label>
                                    <input type="text" value={editProjLogo} onChange={e => setEditProjLogo(e.target.value)} placeholder="/mitchdesigns_logo.jpeg" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-mono text-xs" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Country</label>
                                    <input type="text" value={editProjCountry} onChange={e => setEditProjCountry(e.target.value)} placeholder="Egypt, UAE, Saudi Arabia..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold text-xs" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Latitude (3D Globe)</label>
                                    <input type="text" value={editProjLat} onChange={e => setEditProjLat(e.target.value)} placeholder="30.0444" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-mono text-xs" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Longitude (3D Globe)</label>
                                    <input type="text" value={editProjLng} onChange={e => setEditProjLng(e.target.value)} placeholder="31.2357" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-mono text-xs" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Description</label>
                                <textarea value={editProjDesc} onChange={e => setEditProjDesc(e.target.value)} rows={3} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl" />
                            </div>
                            <button type="submit" className="w-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-2.5 rounded-full text-xs font-bold">
                                Update Portfolio Project
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isEditSkillOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsEditSkillOpen(false); }}
                >
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-6 space-y-4 shadow-xl">
                        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
                            <div>
                                <h3 className="text-sm font-black text-zinc-900 dark:text-white">Edit Skill &amp; Proficiency Level</h3>
                                <p className="text-[10px] text-zinc-400 font-bold mt-0.5">Specialty: {editSkillCat}</p>
                            </div>
                            <button onClick={() => setIsEditSkillOpen(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-lg font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateSkill} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Skill Name *</label>
                                <input type="text" required value={editSkillName} onChange={e => setEditSkillName(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold text-zinc-900 dark:text-white outline-none focus:border-[#BC5C29]" />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                                    Proficiency Level (Beginner to Expert)
                                </label>
                                <select
                                    value={editSkillLevel}
                                    onChange={e => setEditSkillLevel(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl font-bold text-zinc-900 dark:text-white text-xs cursor-pointer outline-none focus:border-[#BC5C29]"
                                >
                                    <option value="Beginner">🌱 Beginner</option>
                                    <option value="Intermediate">⚡ Intermediate</option>
                                    <option value="Advanced">🚀 Advanced</option>
                                    <option value="Expert">👑 Expert</option>
                                </select>
                            </div>

                            <label className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none">
                                <input type="checkbox" checked={editSkillHighlight} onChange={e => setEditSkillHighlight(e.target.checked)} className="rounded text-amber-500 focus:ring-amber-400" />
                                <span className="font-bold text-xs flex items-center gap-1">
                                    <span>⭐</span>
                                    <span>Spotlight on Portfolio &amp; CV</span>
                                </span>
                            </label>

                            <button type="submit" className="w-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-2.5 rounded-xl text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition cursor-pointer">
                                Update Skill
                            </button>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmDeleteModal
                isOpen={!!deleteRequest}
                onClose={() => setDeleteRequest(null)}
                onConfirm={confirmDelete}
                title={deleteRequest?.title || t("Confirm deletion", "تأكيد الحذف")}
                isDeleting={isDeleting}
            />
        </div>
    );
}

function resolveStreamableVideoUrl(url) {
    if (!url) return '';
    const trimmed = String(url).trim();
    const m = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m && (trimmed.includes('googleusercontent.com') || trimmed.includes('drive.google.com'))) {
        return `https://drive.usercontent.google.com/download?id=${m[1]}`;
    }
    return trimmed;
}

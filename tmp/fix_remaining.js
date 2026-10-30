const fs = require("fs");

function updateFile(filePath, transforms) {
  let content = fs.readFileSync(filePath, "utf-8");
  let changed = false;
  for (const { from, to } of transforms) {
    if (content.includes(from)) {
      content = content.replace(from, to);
      changed = true;
    } else {
      console.warn(`[WARN] Not found in ${filePath}:\n${from.slice(0, 60)}...`);
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log("Updated:", filePath);
  }
}

// 1. src/app/admin/settings/page.tsx
updateFile("src/app/admin/settings/page.tsx", [
  {
    from: `      setIsEditingToken(false);
      setIsEditingWebhook(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed" });`,
    to: `      setIsEditingToken(false);
      setIsEditingWebhook(false);
    } catch (error) {
      console.error("Save WhatsApp settings error:", error);
      toast({ variant: "destructive", title: "Save Failed" });`
  },
  {
    from: `      await setDoc(doc(db, "settings", "razorpay"), data, { merge: true });
      toast({ title: "Payment Settings Saved" });
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed" });`,
    to: `      await setDoc(doc(db, "settings", "razorpay"), data, { merge: true });
      toast({ title: "Payment Settings Saved" });
    } catch (error) {
      console.error("Save Razorpay settings error:", error);
      toast({ variant: "destructive", title: "Save Failed" });`
  },
  {
    from: `      await setDoc(doc(db, "settings", "pricing"), { 
        plans, 
        serviceCosts,
        serviceLimits,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      toast({ title: "Pricing & Limits Updated" });
    } catch (error) {
      toast({ variant: "destructive", title: "Pricing Save Failed" });`,
    to: `      await setDoc(doc(db, "settings", "pricing"), { 
        plans, 
        serviceCosts,
        serviceLimits,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      toast({ title: "Pricing & Limits Updated" });
    } catch (error) {
      console.error("Save pricing settings error:", error);
      toast({ variant: "destructive", title: "Pricing Save Failed" });`
  },
  {
    from: `      await setDoc(doc(db, "settings", "offers"), data, { merge: true });
      toast({ title: "Growth Settings Saved" });
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed" });`,
    to: `      await setDoc(doc(db, "settings", "offers"), data, { merge: true });
      toast({ title: "Growth Settings Saved" });
    } catch (error) {
      console.error("Save offers settings error:", error);
      toast({ variant: "destructive", title: "Save Failed" });`
  },
  {
    from: `      await setDoc(doc(db, "settings", "automation"), data, { merge: true });
      toast({ title: "Automation Rules Updated" });
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed" });`,
    to: `      await setDoc(doc(db, "settings", "automation"), data, { merge: true });
      toast({ title: "Automation Rules Updated" });
    } catch (error) {
      console.error("Save automation settings error:", error);
      toast({ variant: "destructive", title: "Save Failed" });`
  }
]);

// 2. src/app/api/whatsapp-status/route.ts
updateFile("src/app/api/whatsapp-status/route.ts", [
  {
    from: `    } catch (err: any) {
      return NextResponse.json({
        success: false,
        status: 'error',
        error: 'Network Error: Failed to communicate with Meta API.'
      }, { status: 502 });`,
    to: `    } catch (err: any) {
      console.error("Meta API token verification network error:", err);
      return NextResponse.json({
        success: false,
        status: 'error',
        error: 'Network Error: Failed to communicate with Meta API.'
      }, { status: 502 });`
  },
  {
    from: `  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        status: 'error', 
        error: 'System Error: Failed to parse request.'
      },
      { status: 500 }
    );`,
    to: `  } catch (error: any) {
    console.error("WhatsApp status check system error:", error);
    return NextResponse.json(
      { 
        success: false, 
        status: 'error', 
        error: 'System Error: Failed to parse request.'
      },
      { status: 500 }
    );`
  }
]);

// 3. src/app/api/whatsapp-webhook/route.ts
updateFile("src/app/api/whatsapp-webhook/route.ts", [
  {
    from: `    return { success: res.ok };
  } catch (err) {
    return { success: false };
  }`,
    to: `    return { success: res.ok };
  } catch (err) {
    console.error("sendDirectMessage error:", err);
    return { success: false };
  }`
  },
  {
    from: `        aiIntent = aiResult.intent;
        detectedLang = aiResult.detectedLanguage || 'hi';
        extractedCity = aiResult.extractedCity;
        extractedCategory = aiResult.extractedCategory;
      } catch (e) {}`,
    to: `        aiIntent = aiResult.intent;
        detectedLang = aiResult.detectedLanguage || 'hi';
        extractedCity = aiResult.extractedCity;
        extractedCategory = aiResult.extractedCategory;
      } catch (e) {
        console.error("WhatsApp bot AI classification error:", e);
      }`
  }
]);

// 4. src/app/dashboard/page.tsx
updateFile("src/app/dashboard/page.tsx", [{
  from: `      toast({ 
        title: !currentValue ? "Service Activated" : "Service Paused",
        description: \`Your preference for \${serviceKey.replace(/([A-Z])/g, ' $1')} has been updated.\`
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });`,
  to: `      toast({ 
        title: !currentValue ? "Service Activated" : "Service Paused",
        description: \`Your preference for \${serviceKey.replace(/([A-Z])/g, ' $1')} has been updated.\`
      });
    } catch (e) {
      console.error("Toggle service error in dashboard:", e);
      toast({ variant: "destructive", title: "Update Failed" });`
}]);

// 5. src/app/login/page.tsx
updateFile("src/app/login/page.tsx", [
  {
    from: `      const result = await confirmationResult.confirm(otp);
      await handlePostAuth(result.user);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Invalid OTP", description: "Please check the code and try again." });`,
    to: `      const result = await confirmationResult.confirm(otp);
      await handlePostAuth(result.user);
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast({ variant: "destructive", title: "Invalid OTP", description: "Please check the code and try again." });`
  },
  {
    from: `      const result = await signInWithPopup(auth, provider);
      await handlePostAuth(result.user);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({ variant: "destructive", title: t('login_fail'), description: error.message });
      }`,
    to: `      const result = await signInWithPopup(auth, provider);
      await handlePostAuth(result.user);
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({ variant: "destructive", title: t('login_fail'), description: error.message });
      }`
  }
]);

// 6. src/app/page.tsx
updateFile("src/app/page.tsx", [{
  from: `      setIsReviewOpen(false);
      setReviewForm(prev => ({ ...prev, content: "", rating: 5 }));
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Review save nahi ho paya." });`,
  to: `      setIsReviewOpen(false);
      setReviewForm(prev => ({ ...prev, content: "", rating: 5 }));
    } catch (err) {
      console.error("Submit testimonial review error:", err);
      toast({ variant: "destructive", title: "Error", description: "Review save nahi ho paya." });`
}]);

// 7. src/app/post-job/page.tsx
updateFile("src/app/post-job/page.tsx", [{
  from: `      toast({ title: t('job_posted_success'), description: t('job_posted_desc') });
      router.push('/jobs');
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to post job." });`,
  to: `      toast({ title: t('job_posted_success'), description: t('job_posted_desc') });
      router.push('/jobs');
    } catch (error) {
      console.error("Failed to post job error:", error);
      toast({ variant: "destructive", title: "Failed to post job." });`
}]);

// 8. src/app/pricing/page.tsx
updateFile("src/app/pricing/page.tsx", [{
  from: `      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });`,
  to: `      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Pricing Razorpay checkout error:", error);
      toast({ variant: "destructive", title: "Error", description: error.message });`
}]);

// 9. src/app/profile/page.tsx
updateFile("src/app/profile/page.tsx", [
  {
    from: `      toast({ title: "Account Deleted", description: "Your data has been permanently removed." });
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {`,
    to: `      toast({ title: "Account Deleted", description: "Your data has been permanently removed." });
      router.push('/');
    } catch (error: any) {
      console.error("Account deletion error:", error);
      if (error.code === 'auth/requires-recent-login') {`
  },
  {
    from: `        description: \`Preferences for \${serviceKey.replace(/([A-Z])/g, ' $1')} updated.\`
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });`,
    to: `        description: \`Preferences for \${serviceKey.replace(/([A-Z])/g, ' $1')} updated.\`
      });
    } catch (e) {
      console.error("Profile toggle service error:", e);
      toast({ variant: "destructive", title: "Update Failed" });`
  }
]);

// 10. src/components/admin/campaigns/BotFlowDesignerTab.tsx
updateFile("src/components/admin/campaigns/BotFlowDesignerTab.tsx", [{
  from: `      await deleteDoc(doc(db, "wa_flows", id)); 
      toast({ title: "Flow Removed" }); 
      if (editingId === id) setEditingId(null);
    } catch (e) {}`,
  to: `      await deleteDoc(doc(db, "wa_flows", id)); 
      toast({ title: "Flow Removed" }); 
      if (editingId === id) setEditingId(null);
    } catch (e) {
      console.error("Delete bot flow error:", e);
    }`
}]);

// 11. src/components/admin/campaigns/BulkSenderTab.tsx
updateFile("src/components/admin/campaigns/BulkSenderTab.tsx", [{
  from: `    } catch (err) {
      setQueueStatuses(prev => ({ ...prev, [contact.id]: { status: 'error', error: 'Network Error' } }));
      return false;
    }`,
  to: `    } catch (err) {
      console.error("Bulk sender dispatch error:", err);
      setQueueStatuses(prev => ({ ...prev, [contact.id]: { status: 'error', error: 'Network Error' } }));
      return false;
    }`
}]);

// 12. src/components/admin/campaigns/ContactManagementTab.tsx
updateFile("src/components/admin/campaigns/ContactManagementTab.tsx", [
  {
    from: `          await addDoc(colRef, contactData).catch(async () => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: colRef.path,
              operation: 'create',
              requestResourceData: contactData
            }));
          });`,
    to: `          await addDoc(colRef, contactData).catch(async (err) => {
            console.error("Database sync addDoc error:", err);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: colRef.path,
              operation: 'create',
              requestResourceData: contactData
            }));
          });`
  },
  {
    from: `          await addDoc(colRef, contactData).catch(async () => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: colRef.path,
              operation: 'create',
              requestResourceData: contactData
            }));
          });`,
    to: `          await addDoc(colRef, contactData).catch(async (err) => {
            console.error("CSV sync addDoc error:", err);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: colRef.path,
              operation: 'create',
              requestResourceData: contactData
            }));
          });`
  },
  {
    from: `      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: contactData
        }));
      })`,
    to: `      .catch(async (err) => {
        console.error("Add manual contact error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: contactData
        }));
      })`
  }
]);

// 13. src/components/layout/Navbar.tsx
updateFile("src/components/layout/Navbar.tsx", [{
  from: `        if (saved) {
          setCachedBranding(JSON.parse(saved));
        }
      } catch (e) {}`,
  to: `        if (saved) {
          setCachedBranding(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Navbar branding load error:", e);
      }`
}]);

// 14. src/components/profile/ResumeBuilder.tsx
updateFile("src/components/profile/ResumeBuilder.tsx", [{
  from: `    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Refine nahi ho paya." });`,
  to: `    } catch (error) {
      console.error("AI Resume Refinement error:", error);
      toast({ variant: "destructive", title: "AI Error", description: "Refine nahi ho paya." });`
}]);

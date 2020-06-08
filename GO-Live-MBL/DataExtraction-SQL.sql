SELECT 
	ReportUser.Name, 
	ReportUser.Email, 
	CASE 
		WHEN ReportUser.boolKeepAnonymous = 1 THEN 'True'
		ELSE 'False'
	END 'Do not display my name on noticeboard',
	CONVERT(VARCHAR(10),SightDetail.SightDateTime,105) as 'Date',
	CONVERT(VARCHAR(10),SightDetail.SightDateTime,108) as 'Time',
	Location.Name 'Location',
	Location.GridReference 'Grid ref',
	Species.Name 'Species',
	CASE 
		WHEN SpeciesSightDetail.boolSensitiveSpeciesRecord = 1 THEN 'True'
		ELSE 'False'
	END 'Do not display record on noticeboard',
	CASE 
		WHEN SpeciesSightDetail.boolOverrideSensitiveSpeciesRecord = 1 THEN 'True'
		ELSE 'False'
	END 'Do not display record on noticeboard (Admin Override)',
	SpeciesSightDetail.Approximation '=/c./+',
	SpeciesSightDetail.Number 'No.',
	SpeciesSightDetail.Details 'Details',
	CASE 
		WHEN PicUpload.FileName IS NOT NULL THEN 'True'
		ELSE 'False'
	END 'Photograph',
	CASE 
		WHEN ReportUser.boolPermissionToContact = 1 THEN 'True'
		ELSE 'False'
	END 'Data protection email opt-in'

FROM [ManxBirdLifeApp].[dbo].[MBL_SightReportUser] AS ReportUser JOIN
	 [ManxBirdLifeApp].[dbo].[MBL_SightDetails] AS SightDetail ON ReportUser.SightReportUserID = SightDetail.SightReportUserID JOIN 
	 [ManxBirdLifeApp].[dbo].[MBL_SpeciesSightingDetails] AS SpeciesSightDetail ON SightDetail.SightDetailsID = SpeciesSightDetail.SightDetailsID JOIN 
	 [ManxBirdLifeApp].[dbo].[LocationLookup] AS Location ON SightDetail.LocationID = Location.LocationID JOIN 
	 [ManxBirdLifeApp].[dbo].[SpeciesLookup] AS Species ON SpeciesSightDetail.SpeciesID = Species.SpeciesID LEFT JOIN 
	 [ManxBirdLifeApp].[dbo].[MBL_SpeciesSightingUploadFile] AS PicUpload ON PicUpload.SpeciesSightingDetailsID = SpeciesSightDetail.SpeciesSightingDetailsID